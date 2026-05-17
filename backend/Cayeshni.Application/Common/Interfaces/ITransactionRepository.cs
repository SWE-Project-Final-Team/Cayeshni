using Cayeshni.API.Domain.Entities;

namespace Cayeshni.API.Application.Common.Interfaces;

public interface ITransactionRepository
{
    Task<Group?> GetGroupWithMembersAsync(Guid groupId);
    Task<bool> GroupExistsAsync(Guid groupId);
    Task AddTransactionAsync(Transaction transaction);
    Task SaveChangesAsync();
    Task<List<Transaction>> GetTransactionsByGroupIdAsync(Guid groupId);
    Task<string?> GetUserNameAsync(Guid userId);
    Task<Transaction?> GetTransactionWithIncludesAsync(Guid transactionId);
    Task<bool> TransactionHasSettlementsAsync(Guid transactionId);
    Task<List<TransactionMember>> GetTransactionMembersByTransactionIdsAsync(IEnumerable<Guid> transactionIds);
    Task RemoveTransactionAsync(Transaction transaction);
    Task<List<Guid>> GetGroupMemberIdsAsync(Guid groupId);
}
