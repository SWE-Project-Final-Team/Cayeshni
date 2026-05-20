using System.Text;
using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Cayeshni.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly ILogger<IdentityService> _logger;
    private readonly string _frontendUrl;
    private readonly bool _requireEmailConfirmation;

    public IdentityService(UserManager<AppUser> userManager, IJwtService jwtService, IEmailService emailService, ILogger<IdentityService> logger, IConfiguration configuration)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _emailService = emailService;
        _logger = logger;
        _frontendUrl  = configuration["App:FrontendUrl"] ?? "http://localhost:3000";
        _requireEmailConfirmation = bool.TryParse(configuration["RequireEmailConfirmation"], out var requireEmailConfirmation)
            ? requireEmailConfirmation
            : false;
    }

    // Auth
    public async Task<TokenPairDto> RegisterAsync(RegisterDto dto)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            throw new ValidationException("Email already in use.");
        var appUser = new AppUser
        {
            Email = dto.Email,
            UserName = dto.Email,
            Name = dto.Name,
            PreferredCurrency = dto.PreferredCurrency,
            EmailConfirmed = !_requireEmailConfirmation
        };

        var result = await _userManager.CreateAsync(appUser, dto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new ValidationException(errors);
        }

        if (_requireEmailConfirmation)
        {
            try
            {
                await SendConfirmationEmailAsync(appUser);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send confirmation email to {Email}", appUser.Email);
                // Registration still succeeds as user can resend later
            }
        }

        return await IssueTokensAsync(appUser);
    }

    public async Task<TokenPairDto> LoginAsync(LoginDto dto)
    {
        var appUser = await _userManager.FindByEmailAsync(dto.Email)
            ?? throw new UnauthorizedException("Invalid email or password.");

        var valid = await _userManager.CheckPasswordAsync(appUser, dto.Password);
        if (!valid)
            throw new UnauthorizedException("Invalid email or password.");

        if (_requireEmailConfirmation && !appUser.EmailConfirmed)
            throw new UnauthorizedException("Please confirm your email first.");

        return await IssueTokensAsync(appUser);
    }

    public async Task<TokenPairDto> RefreshTokenAsync(string refreshToken)
    {
        var userId = _jwtService.ValidateRefreshToken(refreshToken)
            ?? throw new UnauthorizedException("Invalid refresh token.");

        var appUser = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new UnauthorizedException("Invalid refresh token.");

        return await IssueTokensAsync(appUser);
    }

    public Task LogoutAsync()
    {
        // Since we're using stateless JWTs, there's no server-side session to clear.
        // To "logout", the client should simply discard the tokens (by deleting cookie).
        // cookie deleletion handled in the controller
        // Future improvement: Implement token blacklisting to invalidate tokens on logout.
        return Task.CompletedTask;
    }

    // Identity operations
    public async Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException(nameof(AppUser), userId);

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);

        if (!result.Succeeded)
            throw new ValidationException(string.Join(", ", result.Errors.Select(e => e.Description)));
    }

    public async Task ForgotPasswordAsync(string email)
    {
        if (!_requireEmailConfirmation)
            throw new ValidationException("Not enabled.");

        var user = await _userManager.FindByEmailAsync(email);

        // Always succeed silently - don't reveal if email exists or not 
        if (user == null) return;

        await SendPasswordResetEmailAsync(user);
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email)
            ?? throw new ValidationException("Invalid reset request.");

        var token  = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(dto.Token));
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);

        if (!result.Succeeded)
            throw new ValidationException(
                string.Join(", ", result.Errors.Select(e => e.Description)));
    }

    public async Task ConfirmEmailAsync(ConfirmEmailDto dto)
    {
        if (!_requireEmailConfirmation)
            return;

        var user = await _userManager.FindByIdAsync(dto.UserId)
            ?? throw new ValidationException("Invalid confirmation request.");

        if (user.EmailConfirmed)
            return;

        var token  = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(dto.Token));
        var result = await _userManager.ConfirmEmailAsync(user, token);

        if (!result.Succeeded)
            throw new ValidationException("Invalid or expired confirmation token.");
    }

    public async Task ResendConfirmationAsync(string email)
    {
        if (!_requireEmailConfirmation)
            throw new ValidationException("Not enabled.");

        if (string.IsNullOrWhiteSpace(email))
            return;

        var user = await _userManager.FindByEmailAsync(email.Trim());
        if (user is null)
            return;

        if (await _userManager.IsEmailConfirmedAsync(user))
            throw new ValidationException("Email is already confirmed.");

        await SendConfirmationEmailAsync(user);
    }

    private Task<TokenPairDto> IssueTokensAsync(AppUser user)
    {
        var accessToken = _jwtService.GenerateAccessToken(user.Id, user.EmailConfirmed);
        var refreshToken = _jwtService.GenerateRefreshToken(user.Id);

        return Task.FromResult(new TokenPairDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken
        ));
    }

    private async Task SendConfirmationEmailAsync(AppUser user)
    {
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var resetUrl = $"{_frontendUrl}/confirm-email?userId={user.Id}&token={encodedToken}";

        await _emailService.SendAsync(
        to:       user.Email!,
        subject:  "Confirm your Cayeshni account",
        htmlBody: $"""
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
              <h2 style="color:#1a1a1a">Welcome to Cayeshni, {user.Name}!</h2>
              <p style="color:#555">Click the button below to confirm your email address.</p>
              <a href="{resetUrl}"
                 style="display:inline-block;padding:12px 24px;background:#4f46e5;
                        color:#fff;border-radius:6px;text-decoration:none;
                        font-weight:600;margin:16px 0">
                Confirm Email
              </a>
              <p style="color:#999;font-size:12px">
                If you didn't create a Cayeshni account, ignore this email.
              </p>
              <p style="color:#999;font-size:12px">
                Link not working? Copy this URL:<br/>
                <a href="{resetUrl}" style="color:#4f46e5">{resetUrl}</a>
              </p>
            </div>
            """
    );
    }

    private async Task SendPasswordResetEmailAsync(AppUser user)
    {
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var resetUrl = $"{_frontendUrl}/reset-password?email={user.Email}&token={encodedToken}";

        await _emailService.SendAsync(
            to: user.Email!,
            subject: "Reset your Cayeshni password",
            htmlBody: 
                    $"""
                    <p>Click the button below to reset your password:</p>
                    <a href="{resetUrl}"
                       style="display:inline-block;padding:12px 24px;background:#4f46e5;
                              color:#fff;border-radius:6px;text-decoration:none;
                              font-weight:600;margin:16px 0">
                        Reset Password
                    </a>
                    <p style="color:#999;font-size:12px">
                        If you didn't request a password reset, ignore this email.
                    </p>
                    <p style="color:#999;font-size:12px">
                        Link not working? Copy this URL:<br/>
                        <a href="{resetUrl}" style="color:#4f46e5">{resetUrl}</a>
                    </p>
                    """
        );
    }
}

