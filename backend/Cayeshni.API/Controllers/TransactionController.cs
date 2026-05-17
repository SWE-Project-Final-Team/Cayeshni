using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Cayeshni.Application.Features.Transactions;

namespace Cayeshni.API.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionController : ControllerBase
{
    private readonly TransactionService _transactionService;

    public TransactionController(TransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpPost]
    public async Task<ActionResult<TransactionResponseDto>> CreateTransaction(CreateTransactionDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _transactionService.CreateTransactionAsync(Guid.Parse(userId), dto);
        return Ok(result);
    }

    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<List<TransactionResponseDto>>> GetGroupTransactions(Guid groupId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _transactionService.GetGroupTransactionsAsync(groupId);
        return Ok(result);
    }

    [HttpGet("{transactionId}")]
    public async Task<ActionResult<TransactionDetailDto>> GetTransactionDetail(Guid transactionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _transactionService.GetTransactionWithBalancesAsync(transactionId);
        return Ok(result);
    }

    [HttpDelete("{transactionId}")]
    public async Task<IActionResult> DeleteTransaction(Guid transactionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        await _transactionService.DeleteTransactionAsync(Guid.Parse(userId), transactionId);
        return Ok();
    }

    [HttpPut]
    public async Task<ActionResult<TransactionResponseDto>> UpdateTransaction(UpdateTransactionDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _transactionService.UpdateTransactionAsync(Guid.Parse(userId), dto);
        return Ok(result);
    }

    [HttpGet("group/{groupId}/debts")]
    public async Task<ActionResult<List<TransactionMemberBalanceDto>>> GetGroupDebts(Guid groupId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("sub");

        if (userId is null)
            return Unauthorized();

        var result = await _transactionService.GetGroupDebtsAsync(groupId);
        return Ok(result);
    }
}

