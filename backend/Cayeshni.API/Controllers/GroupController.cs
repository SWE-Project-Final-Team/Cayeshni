using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Cayeshni.API.Application.Features.Groups;
using Cayeshni.API.Application.Common.Interfaces;

namespace Cayeshni.API.Controllers;

[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupController : ControllerBase
{
    private readonly IGroupService _groupService;

    public GroupController(IGroupService groupService)
    {
        _groupService = groupService;
    }

    [HttpGet("pending-invites")]
    public async Task<ActionResult<IReadOnlyList<PendingGroupInviteDto>>> GetPendingInvites()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _groupService.GetPendingGroupInvitesAsync(Guid.Parse(userId));
        return Ok(result);
    }

    [HttpDelete("pending-invites/{notificationId:guid}")]
    public async Task<IActionResult> DismissInvite(Guid notificationId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        await _groupService.DismissGroupInviteNotificationAsync(Guid.Parse(userId), notificationId);
        return NoContent();
    }

    [HttpPost("{groupId:guid}/invite-friend")]
    public async Task<IActionResult> InviteFriend(Guid groupId, [FromBody] InviteFriendToGroupDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        await _groupService.SendGroupInviteToFriendAsync(Guid.Parse(userId), groupId, dto);
        return NoContent();
    }

    [HttpPost]
    public async Task<ActionResult<GroupResponseDto>> CreateGroup(CreateGroupDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _groupService.CreateGroupAsync(Guid.Parse(userId), dto);
        return Ok(result);
    }

    [HttpPost("join")]
    public async Task<ActionResult<GroupResponseDto>> JoinGroup(JoinGroupDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _groupService.JoinGroupAsync(Guid.Parse(userId), dto);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<List<GroupResponseDto>>> GetMyGroups()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _groupService.GetUserGroupsAsync(Guid.Parse(userId));
        return Ok(result);
    }

    [HttpGet("{groupId:guid}")]
    public async Task<ActionResult<GroupDetailDto>> GetGroup(Guid groupId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _groupService.GetGroupDetailAsync(Guid.Parse(userId), groupId);
        return Ok(result);
    }

    [HttpPost("exit")]
    public async Task<IActionResult> ExitGroup(Guid groupId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

            await _groupService.ExitGroupAsync(Guid.Parse(userId), groupId);
        return Ok();
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteGroup(GroupResponseDto group)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        await _groupService.DeleteGroupAsync(Guid.Parse(userId), group);
        return Ok();
    }

    [HttpPut]
    public async Task<IActionResult> UpdateGroup(GroupResponseDto group)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");
        if (userId is null)
            return Unauthorized();
        await _groupService.UpdateGroupAsync(Guid.Parse(userId), group);
        return Ok();
    }
}
