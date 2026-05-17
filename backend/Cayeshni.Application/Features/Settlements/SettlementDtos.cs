using Cayeshni.Domain.Enums;

namespace Cayeshni.Application.Features.Settlements;

public record SettlementAllocationDto(
    Guid TransactionId,
    Guid DebtorUserId,
    decimal AllocatedAmount
);

public record CreateSettlementDto(
    Guid GroupId,
    Guid PayerUserId,
    Guid PayeeUserId,
    decimal Amount,
    Currency Currency,
    string? Note,
    List<SettlementAllocationDto> Allocations
);

public record SettlementResponseDto(
    Guid Id,
    Guid GroupId,
    Guid PayerUserId,
    Guid PayeeUserId,
    decimal Amount,
    Currency Currency,
    DateTime CreatedAt,
    string? Note,
    List<SettlementAllocationDto> Allocations
);
