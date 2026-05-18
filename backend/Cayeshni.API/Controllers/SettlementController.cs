using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cayeshni.API.Extensions;
using Cayeshni.Application.Features.Settlements;

namespace Cayeshni.API.Controllers;

[ApiController]
[Route("api/settlements")]
[Authorize]
public class SettlementController : ControllerBase
{
    private readonly SettlementService _settlementService;

    public SettlementController(SettlementService settlementService)
    {
        _settlementService = settlementService;
    }

    [HttpPost]
    public async Task<ActionResult<SettlementResponseDto>> CreateSettlement(CreateSettlementDto dto)
    {
        var result = await _settlementService.CreateSettlementAsync(User.GetUserId(), dto);
        return Ok(result);
    }

    [HttpGet("{groupId}")]
    public async Task<ActionResult<List<SettlementResponseDto>>> GetGroupSettlements(Guid groupId)
    {
        var result = await _settlementService.GetGroupSettlementsAsync(User.GetUserId(), groupId);
        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteSettlement(SettlementResponseDto settlement)
    {
        await _settlementService.DeleteSettlementAsync(User.GetUserId(), settlement);
        return Ok();
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettlement(SettlementResponseDto settlement)
    {
        await _settlementService.UpdateSettlementAsync(User.GetUserId(), settlement);
        return Ok();
    }
}

