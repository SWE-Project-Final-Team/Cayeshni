using Cayeshni.Application.Features.Transactions;
using Cayeshni.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Infrastructure.Persistence.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _db;

    public TransactionRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Group?> GetGroupWithMembersAsync(Guid groupId)
    {
        return await _db.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId);
    }

    public async Task<bool> GroupExistsAsync(Guid groupId)
    {
        return await _db.Groups.AnyAsync(g => g.Id == groupId);
    }

    public async Task AddTransactionAsync(Transaction transaction)
    {
        await _db.Transactions.AddAsync(transaction);
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();

    public async Task<List<Transaction>> GetTransactionsByGroupIdAsync(Guid groupId)
    {
        return await _db.Transactions
            .Where(t => t.GroupId == groupId)
            .Include(t => t.TransactionMembers)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<string?> GetUserNameAsync(Guid userId)
    {
        return await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.Name)
            .FirstOrDefaultAsync();
    }

    public async Task<Transaction?> GetTransactionWithIncludesAsync(Guid transactionId)
    {
        return await _db.Transactions
            .AsSplitQuery()
            .Include(t => t.TransactionMembers)
            .Include(t => t.Allocations)
            .FirstOrDefaultAsync(t => t.Id == transactionId);
    }

    public async Task<bool> TransactionHasSettlementsAsync(Guid transactionId)
    {
        return await _db.SettlementAllocations.AnyAsync(sa => sa.TransactionId == transactionId);
    }

    public async Task<List<TransactionMember>> GetTransactionMembersByTransactionIdsAsync(IEnumerable<Guid> transactionIds)
    {
        return await _db.TransactionMembers
            .AsSplitQuery()
            .Include(tm => tm.Transaction)
            .Where(tm => transactionIds.Contains(tm.TransactionId))
            .Include(tm => tm.Allocations)
            .ToListAsync();
    }

    public Task RemoveTransactionAsync(Transaction transaction)
    {
        _db.Transactions.Remove(transaction);
        return Task.CompletedTask;
    }

    public async Task<List<Guid>> GetGroupMemberIdsAsync(Guid groupId)
    {
        return await _db.GroupMembers
            .Where(gm => gm.GroupId == groupId)
            .Select(gm => gm.UserId)
            .ToListAsync();
    }
}

