using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cayeshni.API.Extensions;
using Cayeshni.Application.Features.Friends;

namespace Cayeshni.API.Controllers;

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

    [HttpPost("request")]
    public async Task<IActionResult> SendRequest(SendFriendRequestDto dto)
    {
        await _friendService.SendRequestAsync(User.GetUserId(), dto);
        return Ok();
    }

    [HttpPost("accept/{requesterId:guid}")]
    public async Task<IActionResult> Accept(Guid requesterId)
    {
        await _friendService.AcceptRequestAsync(User.GetUserId(), requesterId);
        return Ok();
    }

    [HttpDelete("{friendId:guid}")]
    public async Task<IActionResult> Remove(Guid friendId)
    {
        await _friendService.RemoveFriendAsync(User.GetUserId(), friendId);
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetFriends()
    {
        var result = await _friendService.GetFriendsAsync(User.GetUserId());
        return Ok(result);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> Pending()
    {
        var result = await _friendService.GetPendingRequestsAsync(User.GetUserId());
        return Ok(result);
    }
}
