using Cayeshni.Domain.Entities;

namespace Cayeshni.Application.Features.Settlements;

public interface ISettlementRepository
{
    Task<Group?> GetGroupWithMembersAsync(Guid groupId);
    Task AddSettlementAsync(Settlement settlement);
    Task AddSettlementAllocationsAsync(IEnumerable<SettlementAllocation> allocations);
    Task SaveChangesAsync();
    Task<Settlement?> GetSettlementWithAllocationsAsync(Guid settlementId);
    Task RemoveSettlementAsync(Settlement settlement);
    Task<List<Settlement>> GetSettlementsByGroupIdAsync(Guid groupId);
    Task<decimal> SumExistingAllocationsForTransactionAndDebtorAsync(Guid transactionId, Guid debtorUserId);
    Task<List<Transaction>> GetTransactionsByGroupIdAsync(Guid groupId);
}

