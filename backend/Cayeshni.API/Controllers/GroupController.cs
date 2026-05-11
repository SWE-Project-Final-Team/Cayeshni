using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cayeshni.Application.Features.Groups;
using Cayeshni.API.Extensions;

namespace Cayeshni.API.Controller;

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

    [HttpPost]
    public async Task<ActionResult<GroupResponseDto>> CreateGroup(CreateGroupDto dto)
    {
        var userId = User.GetUserId();

        // Apply application layer validation
        var validatedDto = GroupServiceValidation.ValidateCreateGroupDto(dto);
        var result = await _groupService.CreateGroupAsync(userId, validatedDto);
        return Ok(result);
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinGroup(JoinGroupDto dto)
    {
        var userId = User.GetUserId();

        await _groupService.JoinGroupAsync(userId, dto);
        return Ok();
    }

    [HttpPost("exit")]
    public async Task<IActionResult> ExitGroup(Guid groupId)
    {
        var userId = User.GetUserId();

        await _groupService.ExitGroupAsync(userId, groupId);
        return Ok();
    }

    [HttpGet]
    public async Task<ActionResult<List<GroupResponseDto>>> GetMyGroups()
    {
        var userId = User.GetUserId();

        var result = await _groupService.GetUserGroupsAsync(userId);
        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteGroup(GroupResponseDto group)
    {
        var userId = User.GetUserId();

        await _groupService.DeleteGroupAsync(userId, group);
        return Ok();
    }

    [HttpPut]
    public async Task<IActionResult> UpdateGroup(GroupResponseDto group)
    {
        var userId = User.GetUserId();
        await _groupService.UpdateGroupAsync(userId, group);
        return Ok();
    }
}