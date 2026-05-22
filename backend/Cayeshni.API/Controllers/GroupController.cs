using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cayeshni.API.Extensions;
using Cayeshni.Application.Features.Groups;

namespace Cayeshni.API.Controllers;

[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupController : ControllerBase
{
    private readonly GroupService _groupService;

    public GroupController(GroupService groupService)
    {
        _groupService = groupService;
    }

    [HttpGet("pending-invites")]
    public async Task<ActionResult<IReadOnlyList<PendingGroupInviteDto>>> GetPendingInvites()
    {
        var result = await _groupService.GetPendingGroupInvitesAsync(User.GetUserId());
        return Ok(result);
    }

    [HttpDelete("pending-invites/{notificationId:guid}")]
    public async Task<IActionResult> DismissInvite(Guid notificationId)
    {
        await _groupService.DismissGroupInviteNotificationAsync(User.GetUserId(), notificationId);
        return NoContent();
    }

    [HttpPost("{groupId:guid}/invite-friend")]
    public async Task<IActionResult> InviteFriend(Guid groupId, [FromBody] InviteFriendToGroupDto dto)
    {
        await _groupService.SendGroupInviteToFriendAsync(User.GetUserId(), groupId, dto);
        return NoContent();
    }

    [HttpPost]
    public async Task<ActionResult<GroupResponseDto>> CreateGroup(CreateGroupDto dto)
    {
        var result = await _groupService.CreateGroupAsync(User.GetUserId(), dto);
        return Ok(result);
    }

    [HttpPost("join")]
    public async Task<ActionResult<GroupResponseDto>> JoinGroup(JoinGroupDto dto)
    {
        var result = await _groupService.JoinGroupAsync(User.GetUserId(), dto);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<List<GroupResponseDto>>> GetMyGroups()
    {
        var result = await _groupService.GetUserGroupsAsync(User.GetUserId());
        return Ok(result);
    }

    [HttpGet("{groupId:guid}")]
    public async Task<ActionResult<GroupDetailDto>> GetGroup(Guid groupId)
    {
        var result = await _groupService.GetGroupDetailAsync(User.GetUserId(), groupId);
        return Ok(result);
    }

    [HttpPost("exit")]
    public async Task<IActionResult> ExitGroup(Guid groupId)
    {
        await _groupService.ExitGroupAsync(User.GetUserId(), groupId);
        return Ok();
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteGroup(GroupResponseDto group)
    {
        await _groupService.DeleteGroupAsync(User.GetUserId(), group);
        return Ok();
    }

    [HttpPut]
    public async Task<IActionResult> UpdateGroup(GroupResponseDto group)
    {
        await _groupService.UpdateGroupAsync(User.GetUserId(), group);
        return Ok();
    }
}

