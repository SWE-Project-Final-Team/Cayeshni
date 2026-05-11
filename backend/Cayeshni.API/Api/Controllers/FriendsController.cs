using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Cayeshni.API.Application.Features.Users.Friends;

namespace Cayeshni.API.Api.Controllers;

[ApiController]
[Route("api/friends")]
[Authorize]
public class FriendsController : ControllerBase
{
    private readonly FriendService _friendService;

    public FriendsController(FriendService friendService)
    {
        _friendService = friendService;
    }

    private Guid GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub")
                     ?? throw new UnauthorizedAccessException();

        return Guid.Parse(userId);
    }

    [HttpPost("request")]
    public async Task<IActionResult> SendRequest(SendFriendRequestDto dto)
    {
        await _friendService.SendRequestAsync(GetUserId(), dto);
        return Ok();
    }

    [HttpPost("accept/{requesterId:guid}")]
    public async Task<IActionResult> Accept(Guid requesterId)
    {
        await _friendService.AcceptRequestAsync(GetUserId(), requesterId);
        return Ok();
    }

    [HttpDelete("{friendId:guid}")]
    public async Task<IActionResult> Remove(Guid friendId)
    {
        await _friendService.RemoveFriendAsync(GetUserId(), friendId);
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetFriends()
    {
        var result = await _friendService.GetFriendsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> Pending()
    {
        var result = await _friendService.GetPendingRequestsAsync(GetUserId());
        return Ok(result);
    }
}