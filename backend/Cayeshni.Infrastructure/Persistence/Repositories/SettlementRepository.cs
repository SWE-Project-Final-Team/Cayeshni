using Cayeshni.Application.Features.Settlements;
using Cayeshni.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Infrastructure.Persistence.Repositories;

public class SettlementRepository : ISettlementRepository
{
    private readonly AppDbContext _db;

    public SettlementRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Group?> GetGroupWithMembersAsync(Guid groupId)
    {
        return await _db.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId);
    }

    public async Task AddSettlementAsync(Settlement settlement)
    {
        await _db.Settlements.AddAsync(settlement);
    }

    public async Task AddSettlementAllocationsAsync(IEnumerable<SettlementAllocation> allocations)
    {
        await _db.SettlementAllocations.AddRangeAsync(allocations);
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();

    public async Task<Settlement?> GetSettlementWithAllocationsAsync(Guid settlementId)
    {
        return await _db.Settlements
            .Include(s => s.Allocations)
            .FirstOrDefaultAsync(s => s.Id == settlementId);
    }

    public Task RemoveSettlementAsync(Settlement settlement)
    {
        _db.Settlements.Remove(settlement);
        return Task.CompletedTask;
    }

    public async Task<List<Settlement>> GetSettlementsByGroupIdAsync(Guid groupId)
    {
        return await _db.Settlements
            .Where(s => s.GroupId == groupId)
            .Include(s => s.Allocations)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<decimal> SumExistingAllocationsForTransactionAndDebtorAsync(Guid transactionId, Guid debtorUserId)
    {
        return await _db.SettlementAllocations
            .Where(sa => sa.TransactionId == transactionId && sa.DebtorUserId == debtorUserId)
            .SumAsync(sa => sa.AllocatedAmount);
    }

    public async Task<List<Transaction>> GetTransactionsByGroupIdAsync(Guid groupId)
    {
        return await _db.Transactions
            .Include(t => t.TransactionMembers)
            .Where(t => t.GroupId == groupId)
            .ToListAsync();
    }
}

