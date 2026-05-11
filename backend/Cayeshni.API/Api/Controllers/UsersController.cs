using Cayeshni.API.Api.Extensions;
using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Application.Features.Auth;
using Cayeshni.API.Application.Features.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cayeshni.API.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IIdentityService  _identity;

    public UsersController(IUserService userService, IIdentityService identity)
    {
        _userService = userService;
        _identity = identity;
    }

    // Profile
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> GetMe()
    {
        var userId = User.GetUserId();
        var profile = await _userService.GetProfileAsync(userId);
        return Ok(profile);
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(UpdateProfileDto dto)
    {
        var userId = User.GetUserId();
        await _userService.UpdateProfileAsync(userId, dto);
        return NoContent();
    }

    [Authorize]
    [HttpPost("me/picture")]
    public async Task<ActionResult<UploadPictureResponseDto>> UploadPicture(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "File is empty." });

        var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowed.Contains(file.ContentType))
            return BadRequest(new { error = "Only JPEG, PNG and WebP are allowed." });

        var userId = User.GetUserId();

        await using var stream = file.OpenReadStream();
        var response = await _userService.UploadPictureAsync(userId, stream, file.FileName, file.ContentType);

        return Ok(response);
    }

    [Authorize]
    [HttpDelete("me/picture")]
    public async Task<IActionResult> DeletePicture()
    {
        var userId = User.GetUserId();
        await _userService.DeletePictureAsync(userId);
        return NoContent();
    }

    // Password
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var userId = User.GetUserId();
        await _identity.ChangePasswordAsync(userId, dto);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        await _identity.ForgotPasswordAsync(dto.Email);
        return Ok(new { message = "If that email exists, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        await _identity.ResetPasswordAsync(dto);
        return NoContent();
    }

    // Email confirmation
    [Authorize(Policy = "LimitedAccess")]
    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(ConfirmEmailDto dto)
    {
        await _identity.ConfirmEmailAsync(dto);
        return NoContent();
    }

    [Authorize(Policy = "LimitedAccess")]
    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation()
    {
        var userId = User.GetUserId();
        await _identity.ResendConfirmationAsync(userId);
        return Ok(new { message = "Confirmation email sent." });
    }
}
