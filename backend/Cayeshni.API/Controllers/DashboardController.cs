using Cayeshni.API.Extensions;
using Cayeshni.Application.Features.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cayeshni.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [Authorize]
    [HttpGet("group-balances")]
    public async Task<ActionResult<IReadOnlyList<DashboardGroupBalanceDto>>> GetGroupBalances()
    {
        var userId = User.GetUserId();
        var result = await _dashboardService.GetGroupBalancesAsync(userId);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("recent-activity")]
    public async Task<ActionResult<IReadOnlyList<DashboardActivityItemDto>>> GetRecentActivity(
        [FromQuery] int limit = 20)
    {
        var userId = User.GetUserId();
        var result = await _dashboardService.GetRecentActivityAsync(userId, limit);
        return Ok(result);
    }
}