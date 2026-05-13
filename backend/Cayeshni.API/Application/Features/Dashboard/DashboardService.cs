using Cayeshni.API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.API.Application.Features.Dashboard;

public class DashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<DashboardGroupBalanceDto>> GetGroupBalancesAsync(Guid userId)
    {
        var memberships = await _db.GroupMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId)
            .Include(m => m.Group)
            .OrderBy(m => m.Group.Name)
            .ToListAsync();

        if (memberships.Count == 0)
            return Array.Empty<DashboardGroupBalanceDto>();

        var groupIds = memberships.Select(m => m.GroupId).Distinct().ToList();

        var membersByGroup = await _db.GroupMembers
            .AsNoTracking()
            .Where(m => groupIds.Contains(m.GroupId))
            .GroupBy(m => m.GroupId)
            .ToDictionaryAsync(g => g.Key, g => g.Select(x => x.UserId).ToHashSet());

        var transactions = await _db.Transactions
            .AsNoTracking()
            .Where(t => groupIds.Contains(t.GroupId))
            .Include(t => t.TransactionMembers)
            .ToListAsync();

        var settlements = await _db.Settlements
            .AsNoTracking()
            .Where(s => groupIds.Contains(s.GroupId))
            .ToListAsync();

        var list = new List<DashboardGroupBalanceDto>(memberships.Count);

        foreach (var gm in memberships)
        {
            var gid = gm.GroupId;
            var group = gm.Group;
            if (!membersByGroup.TryGetValue(gid, out var memberIds))
                memberIds = new HashSet<Guid>();

            var balance = memberIds.ToDictionary(id => id, _ => 0m);

            foreach (var tx in transactions.Where(t => t.GroupId == gid))
            {
                if (balance.ContainsKey(tx.PaidByUserId))
                    balance[tx.PaidByUserId] += tx.TotalAmount;

                foreach (var tm in tx.TransactionMembers)
                {
                    if (balance.ContainsKey(tm.UserId))
                        balance[tm.UserId] -= tm.AmountOwed;
                }
            }

            foreach (var s in settlements.Where(s => s.GroupId == gid))
            {
                // Payer = debtor who sends money; payee = creditor who receives.
                // Transaction phase: creditor +total, debtors -amountOwed (debtors negative).
                // Settlement moves money from debtor to creditor: debtor balance increases, creditor decreases.
                if (balance.ContainsKey(s.PayerUserId))
                    balance[s.PayerUserId] += s.Amount;
                if (balance.ContainsKey(s.PayeeUserId))
                    balance[s.PayeeUserId] -= s.Amount;
            }

            var net = balance.GetValueOrDefault(userId);
            var youAreOwed = net > 0 ? net : 0;
            var youOwe = net < 0 ? -net : 0;

            list.Add(new DashboardGroupBalanceDto(
                gid,
                group.Name,
                group.DefaultCurrency,
                decimal.Round(youOwe, 2, MidpointRounding.AwayFromZero),
                decimal.Round(youAreOwed, 2, MidpointRounding.AwayFromZero)));
        }

        return list;
    }

    public async Task<IReadOnlyList<DashboardActivityItemDto>> GetRecentActivityAsync(Guid userId, int limit = 20)
    {
        limit = Math.Clamp(limit, 1, 50);

        var groupIds = await _db.GroupMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId)
            .Select(m => m.GroupId)
            .Distinct()
            .ToListAsync();

        if (groupIds.Count == 0)
            return Array.Empty<DashboardActivityItemDto>();

        var recentTx = await _db.Transactions
            .AsNoTracking()
            .Where(t => groupIds.Contains(t.GroupId))
            .Include(t => t.Group)
            .OrderByDescending(t => t.CreatedAt)
            .Take(Math.Max(limit * 2, 30))
            .ToListAsync();

        var recentSettlements = await _db.Settlements
            .AsNoTracking()
            .Where(s => groupIds.Contains(s.GroupId))
            .Include(s => s.Group)
            .OrderByDescending(s => s.CreatedAt)
            .Take(Math.Max(limit * 2, 30))
            .ToListAsync();

        var userIds = new HashSet<Guid>();
        foreach (var t in recentTx)
            userIds.Add(t.PaidByUserId);
        foreach (var s in recentSettlements)
        {
            userIds.Add(s.PayerUserId);
            userIds.Add(s.PayeeUserId);
        }

        var names = await _db.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name);

        var txItems = recentTx.Select(t => new DashboardActivityItemDto(
            Kind: "transaction",
            Id: t.Id,
            GroupId: t.GroupId,
            GroupName: t.Group.Name,
            CreatedAt: t.CreatedAt,
            Currency: t.Currency,
            Amount: t.TotalAmount,
            Description: t.Description,
            ActorUserId: t.PaidByUserId,
            ActorName: names.GetValueOrDefault(t.PaidByUserId) ?? "Someone",
            CounterpartyUserId: null,
            CounterpartyName: null,
            Note: null
        ));

        var settlementItems = recentSettlements.Select(s => new DashboardActivityItemDto(
            Kind: "settlement",
            Id: s.Id,
            GroupId: s.GroupId,
            GroupName: s.Group.Name,
            CreatedAt: s.CreatedAt,
            Currency: s.Currency,
            Amount: s.Amount,
            Description: null,
            ActorUserId: s.PayerUserId,
            ActorName: names.GetValueOrDefault(s.PayerUserId) ?? "Someone",
            CounterpartyUserId: s.PayeeUserId,
            CounterpartyName: names.GetValueOrDefault(s.PayeeUserId) ?? "Someone",
            Note: s.note
        ));

        return txItems
            .Concat(settlementItems)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToList();
    }
}
