using Cayeshni.API.Domain.Entities;

namespace Cayeshni.API.Application.Common.Interfaces;

public interface IFriendRepository
{
    Task<(Guid Id, string Name, string? Email, string? ProfilePicturePath)?> FindUserByNormalizedEmailAsync(string normalizedEmail);
    Task<bool> UserExistsAsync(Guid id);
    Task<Friendship?> FindFriendshipAsync(Guid userA, Guid userB);
    Task AddFriendshipAsync(Friendship friendship);
    Task SaveChangesAsync();
    Task<List<Friendship>> GetPendingFriendshipsForUserAsync(Guid userId);
    Task<Dictionary<Guid, (string Name, string Email, string? ProfilePicturePath)>> GetUsersByIdsAsync(IEnumerable<Guid> ids);
    void RemoveFriendship(Friendship friendship);
    Task<List<Friendship>> GetFriendsForUserAsync(Guid userId);
}
