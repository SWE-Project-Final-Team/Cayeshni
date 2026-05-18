using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cayeshni.API.Extensions;
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
        var result = await _transactionService.CreateTransactionAsync(User.GetUserId(), dto);
        return Ok(result);
    }

    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<List<TransactionResponseDto>>> GetGroupTransactions(Guid groupId)
    {
        var result = await _transactionService.GetGroupTransactionsAsync(groupId);
        return Ok(result);
    }

    [HttpGet("{transactionId}")]
    public async Task<ActionResult<TransactionDetailDto>> GetTransactionDetail(Guid transactionId)
    {
        var result = await _transactionService.GetTransactionWithBalancesAsync(transactionId);
        return Ok(result);
    }

    [HttpDelete("{transactionId}")]
    public async Task<IActionResult> DeleteTransaction(Guid transactionId)
    {
        await _transactionService.DeleteTransactionAsync(User.GetUserId(), transactionId);
        return Ok();
    }

    [HttpPut]
    public async Task<ActionResult<TransactionResponseDto>> UpdateTransaction(UpdateTransactionDto dto)
    {
        var result = await _transactionService.UpdateTransactionAsync(User.GetUserId(), dto);
        return Ok(result);
    }

    [HttpGet("group/{groupId}/debts")]
    public async Task<ActionResult<List<TransactionMemberBalanceDto>>> GetGroupDebts(Guid groupId)
    {
        var result = await _transactionService.GetGroupDebtsAsync(groupId);
        return Ok(result);
    }
}

