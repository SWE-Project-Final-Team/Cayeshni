using Cayeshni.Domain.Entities;

namespace Cayeshni.Application.Features.Dashboard;

public interface IDashboardRepository
{
    Task<List<GroupMember>> GetMembershipsForUserAsync(Guid userId);
    Task<List<GroupMember>> GetMembersByGroupIdsAsync(IEnumerable<Guid> groupIds);
    Task<List<Transaction>> GetTransactionsByGroupIdsAsync(IEnumerable<Guid> groupIds);
    Task<List<Settlement>> GetSettlementsByGroupIdsAsync(IEnumerable<Guid> groupIds);
    Task<Dictionary<Guid, string>> GetUserNamesByIdsAsync(IEnumerable<Guid> ids);
}

