using Cayeshni.API.Extensions;
using Cayeshni.Application.Features.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cayeshni.API.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
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
}