using Cayeshni.Domain.Enums;

namespace Cayeshni.Application.Features.Transactions;

public record TransactionMemberDto(
    Guid UserId,
    decimal AmountOwed
);

public record CreateTransactionDto(
    Guid GroupId,
    decimal TotalAmount,
    Currency Currency,
    TransactionCategory Category = TransactionCategory.Other,
    string? Description = null,
    List<TransactionMemberDto>? Members = null
);

public record TransactionResponseDto(
    Guid Id,
    Guid GroupId,
    Guid PaidByUserId,
    string PaidByDisplayName,
    decimal TotalAmount,
    Currency Currency,
    TransactionCategory Category,
    string? Description,
    DateTime CreatedAt,
    List<TransactionMemberDto> Members
);

public record UpdateTransactionDto(
    Guid Id,
    string? Description = null,
    TransactionCategory? Category = null
);

public record TransactionMemberBalanceDto(
    Guid UserId,
    decimal TotalOwed,
    decimal SettledAmount,
    decimal RemainingOwed
);

public record TransactionDetailDto(
    Guid Id,
    Guid GroupId,
    Guid PaidByUserId,
    decimal TotalAmount,
    Currency Currency,
    TransactionCategory Category,
    string? Description,
    DateTime CreatedAt,
    List<TransactionMemberBalanceDto> Members
);

