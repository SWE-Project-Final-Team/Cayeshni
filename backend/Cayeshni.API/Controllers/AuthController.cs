using Microsoft.AspNetCore.Mvc;
using Cayeshni.API.Application.Features.Auth;
using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Services;
using Cayeshni.API.Extensions;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.RateLimiting;

namespace Cayeshni.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly CookieService _cookieService;

    public AuthController(AuthService authService, CookieService cookieService)
    {
        _authService = authService;
        _cookieService = cookieService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
    {
        return Ok(CreateAuthResponse(await _authService.RegisterAsync(registerDto)));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
    {
        return Ok(CreateAuthResponse(await _authService.LoginAsync(loginDto)));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh()
    {
        var refreshToken = _cookieService.GetRefreshToken(Request)
            ?? throw new UnauthorizedException("Refresh token is missing.");

        return Ok(CreateAuthResponse(await _authService.RefreshTokenAsync(refreshToken)));
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        _cookieService.ClearRefreshToken(Response);
        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var userId = User.GetUserId();
        await _authService.ChangePasswordAsync(userId, dto);
        return NoContent();
    }

    [AllowAnonymous]
    [EnableRateLimiting("resend")]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        await _authService.ForgotPasswordAsync(dto.Email);
        return Ok(new { message = "If that email exists, a reset link has been sent." });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        await _authService.ResetPasswordAsync(dto);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(ConfirmEmailDto dto)
    {
        await _authService.ConfirmEmailAsync(dto);
        return NoContent();
    }

    [AllowAnonymous]
    [EnableRateLimiting("resend")]
    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation(ResendConfirmationDto dto)
    {
        await _authService.ResendConfirmationAsync(dto.Email);
        return Ok(new { message = "If that email is registered and unconfirmed, a new link has been sent." });
    }

    private AuthResponseDto CreateAuthResponse(TokenPairDto tokens)
    {
        _cookieService.SetRefreshToken(Response, tokens.RefreshToken);
        return new AuthResponseDto(
            tokens.AccessToken,
            EmailConfirmed: ParseEmailConfirmed(tokens.AccessToken)
        );
    }

    private static bool ParseEmailConfirmed(string accessToken)
    {
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(accessToken);
        var claim = jwt.Claims.FirstOrDefault(c => c.Type == "email_confirmed");
        return claim?.Value == "true";
    }
}
