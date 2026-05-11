using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Cayeshni.API.Application.Features.Groups;
using Cayeshni.API.Application.Common.Interfaces;

namespace Cayeshni.API.Api.Controllers;

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
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        // Apply application layer validation
        var validatedDto = GroupServiceValidation.ValidateCreateGroupDto(dto);
        var result = await _groupService.CreateGroupAsync(Guid.Parse(userId), validatedDto);
        return Ok(result);
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinGroup(JoinGroupDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        await _groupService.JoinGroupAsync(Guid.Parse(userId), dto);
        return Ok();
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
