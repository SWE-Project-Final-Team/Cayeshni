using Cayeshni.Application.Features.Dashboard;
using Cayeshni.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Infrastructure.Persistence.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly AppDbContext _db;

    public DashboardRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<GroupMember>> GetMembershipsForUserAsync(Guid userId)
    {
        return await _db.GroupMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId)
            .Include(m => m.Group)
            .OrderBy(m => m.Group.Name)
            .ToListAsync();
    }

    public async Task<List<GroupMember>> GetMembersByGroupIdsAsync(IEnumerable<Guid> groupIds)
    {
        return await _db.GroupMembers
            .AsNoTracking()
            .Where(m => groupIds.Contains(m.GroupId))
            .ToListAsync();
    }

    public async Task<List<Transaction>> GetTransactionsByGroupIdsAsync(IEnumerable<Guid> groupIds)
    {
        return await _db.Transactions
            .AsNoTracking()
            .AsSplitQuery()
            .Where(t => groupIds.Contains(t.GroupId))
            .Include(t => t.TransactionMembers)
            .Include(t => t.Group)
            .ToListAsync();
    }

    public async Task<List<Settlement>> GetSettlementsByGroupIdsAsync(IEnumerable<Guid> groupIds)
    {
        return await _db.Settlements
            .AsNoTracking()
            .Where(s => groupIds.Contains(s.GroupId))
            .Include(s => s.Group)
            .ToListAsync();
    }

    public async Task<Dictionary<Guid, string>> GetUserNamesByIdsAsync(IEnumerable<Guid> ids)
    {
        return await _db.Users
            .AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name);
    }
}

