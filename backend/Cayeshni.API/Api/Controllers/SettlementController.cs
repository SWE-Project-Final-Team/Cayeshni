using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Cayeshni.API.Application.Features.Settlements;
using Cayeshni.API.Application.Common.Interfaces;

namespace Cayeshni.API.Api.Controllers;

[ApiController]
[Route("api/settlements")]
[Authorize]
public class SettlementController : ControllerBase
{
    private readonly ISettlementService _settlementService;

    public SettlementController(ISettlementService settlementService)
    {
        _settlementService = settlementService;
    }

    [HttpPost]
    public async Task<ActionResult<SettlementResponseDto>> CreateSettlement(CreateSettlementDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _settlementService.CreateSettlementAsync(Guid.Parse(userId), dto);
        return Ok(result);
    }

    [HttpGet("{groupId}")]
    public async Task<ActionResult<List<SettlementResponseDto>>> GetGroupSettlements(Guid groupId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _settlementService.GetGroupSettlementsAsync(groupId);
        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteSettlement(SettlementResponseDto settlement)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        await _settlementService.DeleteSettlementAsync(Guid.Parse(userId), settlement);
        return Ok();
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettlement(SettlementResponseDto settlement)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        await _settlementService.UpdateSettlementAsync(Guid.Parse(userId), settlement);
        return Ok();
    }
}
