using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Cayeshni.Application.Features.Groups;

namespace Cayeshni.API.Controller;

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
    public async Task<IActionResult> JoinGroup(JoinGroupDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        await _groupService.JoinGroupAsync(Guid.Parse(userId), dto);
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
}