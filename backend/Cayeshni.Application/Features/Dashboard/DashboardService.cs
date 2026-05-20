using Cayeshni.Application.Features.Dashboard;

namespace Cayeshni.Application.Features.Dashboard;

public class DashboardService
{
    private readonly IDashboardRepository _repo;

    public DashboardService(IDashboardRepository repo)
    {
        _repo = repo;
    }

    public async Task<IReadOnlyList<DashboardGroupBalanceDto>> GetGroupBalancesAsync(Guid userId)
    {
        var memberships = await _repo.GetMembershipsForUserAsync(userId);

        if (memberships.Count == 0)
            return Array.Empty<DashboardGroupBalanceDto>();

        var groupIds = memberships.Select(m => m.GroupId).Distinct().ToList();

        var membersByGroup = await _repo.GetMembersByGroupIdsAsync(groupIds);

        var membersByGroupLookup = membersByGroup
            .GroupBy(m => m.GroupId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.UserId).ToHashSet());

        var transactions = await _repo.GetTransactionsByGroupIdsAsync(groupIds);

        var settlements = await _repo.GetSettlementsByGroupIdsAsync(groupIds);

        var list = new List<DashboardGroupBalanceDto>(memberships.Count);

        foreach (var gm in memberships)
        {
            var gid = gm.GroupId;
            var group = gm.Group;
            if (!membersByGroupLookup.TryGetValue(gid, out var memberIds))
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

        var groupMemberships = await _repo.GetMembershipsForUserAsync(userId);
        var groupIds = groupMemberships.Select(m => m.GroupId).Distinct().ToList();

        if (groupIds.Count == 0)
            return Array.Empty<DashboardActivityItemDto>();

        var recentTx = await _repo.GetTransactionsByGroupIdsAsync(groupIds);

        var recentSettlements = await _repo.GetSettlementsByGroupIdsAsync(groupIds);

        var userIds = new HashSet<Guid>();
        foreach (var t in recentTx)
            userIds.Add(t.PaidByUserId);
        foreach (var s in recentSettlements)
        {
            userIds.Add(s.PayerUserId);
            userIds.Add(s.PayeeUserId);
        }

        var names = await _repo.GetUserNamesByIdsAsync(userIds);

        var txItems = recentTx.Select(t => new DashboardActivityItemDto(
            Kind: "transaction",
            Id: t.Id,
            GroupId: t.GroupId,
            GroupName: t.Group?.Name ?? "Unknown",
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
            GroupName: s.Group?.Name ?? "Unknown",
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

