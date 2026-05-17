using Cayeshni.API.Domain.Entities;

namespace Cayeshni.API.Application.Common.Interfaces;

public interface IDashboardRepository
{
    Task<List<GroupMember>> GetMembershipsForUserAsync(Guid userId);
    Task<List<GroupMember>> GetMembersByGroupIdsAsync(IEnumerable<Guid> groupIds);
    Task<List<Transaction>> GetTransactionsByGroupIdsAsync(IEnumerable<Guid> groupIds);
    Task<List<Settlement>> GetSettlementsByGroupIdsAsync(IEnumerable<Guid> groupIds);
    Task<Dictionary<Guid, string>> GetUserNamesByIdsAsync(IEnumerable<Guid> ids);
}
