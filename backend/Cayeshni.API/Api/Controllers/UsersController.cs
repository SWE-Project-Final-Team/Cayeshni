using Cayeshni.API.Api.Extensions;
using Cayeshni.API.Application.Features.Dashboard;
using Cayeshni.API.Application.Features.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cayeshni.API.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly DashboardService _dashboardService;

    public UsersController(IUserService userService, DashboardService dashboardService)
    {
        _userService = userService;
        _dashboardService = dashboardService;
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

    [Authorize]
    [HttpGet("~/api/dashboard/group-balances")]
    public async Task<ActionResult<IReadOnlyList<DashboardGroupBalanceDto>>> DashboardGroupBalances()
    {
        var userId = User.GetUserId();
        var result = await _dashboardService.GetGroupBalancesAsync(userId);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("~/api/dashboard/recent-activity")]
    public async Task<ActionResult<IReadOnlyList<DashboardActivityItemDto>>> DashboardRecentActivity(
        [FromQuery] int limit = 20)
    {
        var userId = User.GetUserId();
        var result = await _dashboardService.GetRecentActivityAsync(userId, limit);
        return Ok(result);
    }
}
