using Cayeshni.Domain.Enums;
namespace Cayeshni.Domain.Entities;

public class Friendship
{
    public string UserIdA { get; set; } = string.Empty;
    public string UserIdB { get; set; } = string.Empty;

    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}