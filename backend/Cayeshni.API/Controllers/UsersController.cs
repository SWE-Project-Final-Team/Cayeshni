using Cayeshni.API.Extensions;
using Cayeshni.Application.Features.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cayeshni.API.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService)
    {
        _userService = userService;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> GetMe()
    {
        var userId = User.GetUserId();
        var profile = await _userService.GetProfileAsync(userId);
        return Ok(profile);
    }

    [Authorize]
    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyList<UserProfileSearchDto>>> SearchProfiles(
        [FromQuery(Name = "q")] string? q)
    {
        var userId = User.GetUserId();
        var results = await _userService.SearchProfilesByDisplayNameAsync(userId, q ?? "");
        return Ok(results);
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

