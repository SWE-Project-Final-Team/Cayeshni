using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cayeshni.Application.Features.Dashboard;
using Cayeshni.Application.Features.Transactions;
using Cayeshni.Application.Features.Settlements;
using Cayeshni.Application.Features.Groups;
using Cayeshni.Application.Features.Friends;
using Cayeshni.Application.Features.Users;
using Cayeshni.Domain.Entities;
using Cayeshni.Domain.Enums;
using Cayeshni.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Tests.TestDoubles;

public sealed class FakeGroupRepository : IGroupRepository
{
    private readonly AppDbContext _db;
    public FakeGroupRepository(AppDbContext db) => _db = db;

    public Task AddAsync(Group group)
    {
        _db.Groups.Add(group);
        return Task.CompletedTask;
    }

    public Task<Group?> GetByInviteTokenWithMembersAsync(string inviteToken)
        => _db.Groups.Include(g => g.Members).FirstOrDefaultAsync(g => g.InviteToken == inviteToken)!;

    public Task<Group?> GetByIdWithMembersAsync(Guid id)
        => _db.Groups.Include(g => g.Members).FirstOrDefaultAsync(g => g.Id == id)!;

    public Task<List<Group>> GetUserGroupsAsync(Guid userId)
        => _db.Groups.Include(g => g.Members)
            .Where(g => g.Members.Any(m => m.UserId == userId))
            .ToListAsync();

    public async Task<List<(Guid Id, string Name, string? ProfilePicturePath)>> GetUsersByIdsAsync(IEnumerable<Guid> ids)
    {
        var users = await _db.Users.Where(u => ids.Contains(u.Id)).ToListAsync();
        return users.Select(u => (u.Id, u.Name, u.ProfilePicturePath)).ToList();
    }

    public void RemoveGroupMember(GroupMember membership) => _db.GroupMembers.Remove(membership);
    public void RemoveGroupMembers(IEnumerable<GroupMember> memberships) => _db.GroupMembers.RemoveRange(memberships);
    public void RemoveGroup(Group group) => _db.Groups.Remove(group);

    public async Task<(Guid Id, string Name, string? ProfilePicturePath)?> GetUserBasicAsync(Guid id)
    {
        var users = await _db.Users.Where(u => u.Id == id).ToListAsync();
        var u = users.FirstOrDefault();
        return u == null ? null : (u.Id, u.Name, u.ProfilePicturePath);
    }

    public Task<bool> AreFriendsAsync(Guid userA, Guid userB)
    {
        var a = userA.CompareTo(userB) < 0 ? userA : userB;
        var b = userA.CompareTo(userB) < 0 ? userB : userA;
        return _db.Friendships.AnyAsync(f => f.UserIdA == a && f.UserIdB == b && f.Status == FriendshipStatus.Friends);
    }

    public Task AddNotificationAsync(Notification notification)
    {
        _db.Notifications.Add(notification);
        return Task.CompletedTask;
    }

    public Task<List<Notification>> GetPendingGroupInvitesAsync(Guid userId)
        => _db.Notifications.Where(n => n.RecipientId == userId && n.Type == NotificationType.GroupInviteReceived).ToListAsync();

    public Task<Notification?> GetNotificationForUserAsync(Guid notificationId, Guid userId)
        => _db.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientId == userId)!;

    public Task RemoveNotificationAsync(Notification notification)
    {
        _db.Notifications.Remove(notification);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}

public sealed class FakeFriendRepository : IFriendRepository
{
    private readonly AppDbContext _db;
    public FakeFriendRepository(AppDbContext db) => _db = db;

    public async Task<(Guid Id, string Name, string? Email, string? ProfilePicturePath)?> FindUserByNormalizedEmailAsync(string normalizedEmail)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail);
        return user == null ? null : (user.Id, user.Name, user.Email, (string?)user.ProfilePicturePath);
    }

    public Task<bool> UserExistsAsync(Guid id) => _db.Users.AnyAsync(u => u.Id == id);

    public async Task<Friendship?> FindFriendshipAsync(Guid userA, Guid userB)
    {
        var a = userA.CompareTo(userB) < 0 ? userA : userB;
        var b = userA.CompareTo(userB) < 0 ? userB : userA;
        return await _db.Friendships.FirstOrDefaultAsync(f => f.UserIdA == a && f.UserIdB == b);
    }

    public Task AddFriendshipAsync(Friendship f)
    {
        _db.Friendships.Add(f);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();

    public Task<List<Friendship>> GetPendingFriendshipsForUserAsync(Guid userId)
        => _db.Friendships.Where(f => (f.UserIdA == userId || f.UserIdB == userId) && f.Status == FriendshipStatus.Pending).ToListAsync();

    public async Task<Dictionary<Guid, (string Name, string Email, string? ProfilePicturePath)>> GetUsersByIdsAsync(IEnumerable<Guid> ids)
    {
        var users = await _db.Users.Where(u => ids.Contains(u.Id)).ToListAsync();
        return users.ToDictionary(u => u.Id, u => (u.Name, u.Email ?? "", (string?)u.ProfilePicturePath));
    }

    public void RemoveFriendship(Friendship f) => _db.Friendships.Remove(f);

    public Task<List<Friendship>> GetFriendsForUserAsync(Guid userId)
        => _db.Friendships.Where(f => (f.UserIdA == userId || f.UserIdB == userId) && f.Status == FriendshipStatus.Friends).ToListAsync();
}

public sealed class FakeDashboardRepository : IDashboardRepository
{
    private readonly AppDbContext _db;
    public FakeDashboardRepository(AppDbContext db) => _db = db;

    public Task<List<GroupMember>> GetMembershipsForUserAsync(Guid userId)
        => _db.GroupMembers.Where(m => m.UserId == userId).ToListAsync();

    public Task<List<GroupMember>> GetMembersByGroupIdsAsync(IEnumerable<Guid> groupIds)
        => _db.GroupMembers.Where(m => groupIds.Contains(m.GroupId)).ToListAsync();

    public Task<List<Transaction>> GetTransactionsByGroupIdsAsync(IEnumerable<Guid> groupIds)
        => _db.Transactions.Include(t => t.TransactionMembers).Where(t => groupIds.Contains(t.GroupId)).ToListAsync();

    public Task<List<Settlement>> GetSettlementsByGroupIdsAsync(IEnumerable<Guid> groupIds)
        => _db.Settlements.Where(s => groupIds.Contains(s.GroupId)).ToListAsync();

    public async Task<Dictionary<Guid, string>> GetUserNamesByIdsAsync(IEnumerable<Guid> ids)
    {
        var users = await _db.Users.Where(u => ids.Contains(u.Id)).ToListAsync();
        return users.ToDictionary(u => u.Id, u => u.Name);
    }
}

public sealed class FakeTransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _db;
    public FakeTransactionRepository(AppDbContext db) => _db = db;
    public Task<Group?> GetGroupWithMembersAsync(Guid groupId)
        => _db.Groups.Include(g => g.Members).FirstOrDefaultAsync(g => g.Id == groupId);

    public Task<bool> GroupExistsAsync(Guid groupId) => _db.Groups.AnyAsync(g => g.Id == groupId);

    public Task AddTransactionAsync(Transaction transaction)
    {
        _db.Transactions.Add(transaction);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();

    public Task<List<Transaction>> GetTransactionsByGroupIdAsync(Guid groupId)
        => _db.Transactions.Include(t => t.TransactionMembers).Where(t => t.GroupId == groupId).ToListAsync();

    public Task<string?> GetUserNameAsync(Guid userId)
        => _db.Users.Where(u => u.Id == userId).Select(u => u.Name).FirstOrDefaultAsync();

    public Task<Transaction?> GetTransactionWithIncludesAsync(Guid transactionId)
        => _db.Transactions
            .Include(t => t.TransactionMembers)
            .Include(t => t.Allocations)
            .FirstOrDefaultAsync(t => t.Id == transactionId);

    public Task<bool> TransactionHasSettlementsAsync(Guid transactionId)
        => _db.SettlementAllocations.AnyAsync(sa => sa.TransactionId == transactionId);

    public Task<List<TransactionMember>> GetTransactionMembersByTransactionIdsAsync(IEnumerable<Guid> transactionIds)
        => _db.TransactionMembers.Include(tm => tm.Allocations).Where(tm => transactionIds.Contains(tm.TransactionId)).ToListAsync();

    public Task RemoveTransactionAsync(Transaction transaction)
    {
        _db.Transactions.Remove(transaction);
        return Task.CompletedTask;
    }

    public Task<List<Guid>> GetGroupMemberIdsAsync(Guid groupId)
        => _db.GroupMembers.Where(m => m.GroupId == groupId).Select(m => m.UserId).ToListAsync();
}

public sealed class FakeSettlementRepository : ISettlementRepository
{
    private readonly AppDbContext _db;
    public FakeSettlementRepository(AppDbContext db) => _db = db;

    public Task<Group?> GetGroupWithMembersAsync(Guid groupId)
        => _db.Groups.Include(g => g.Members).FirstOrDefaultAsync(g => g.Id == groupId);

    public Task AddSettlementAsync(Settlement s)
    {
        _db.Settlements.Add(s);
        return Task.CompletedTask;
    }

    public Task AddSettlementAllocationsAsync(IEnumerable<SettlementAllocation> allocations)
    {
        _db.SettlementAllocations.AddRange(allocations);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();

    public Task<Settlement?> GetSettlementWithAllocationsAsync(Guid settlementId)
        => _db.Settlements.Include(s => s.Allocations).FirstOrDefaultAsync(s => s.Id == settlementId);

    public Task RemoveSettlementAsync(Settlement settlement)
    {
        _db.Settlements.Remove(settlement);
        return Task.CompletedTask;
    }

    public Task<List<Settlement>> GetSettlementsByGroupIdAsync(Guid groupId)
        => _db.Settlements.Include(s => s.Allocations).Where(s => s.GroupId == groupId).ToListAsync();

    public Task<decimal> SumExistingAllocationsForTransactionAndDebtorAsync(Guid transactionId, Guid debtorUserId)
        => _db.SettlementAllocations.Where(a => a.TransactionId == transactionId && a.DebtorUserId == debtorUserId).SumAsync(a => a.AllocatedAmount);

    public Task<List<Transaction>> GetTransactionsByGroupIdAsync(Guid groupId)
        => _db.Transactions.Include(t => t.TransactionMembers).Where(t => t.GroupId == groupId).ToListAsync();
}

