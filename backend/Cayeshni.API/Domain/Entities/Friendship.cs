using Cayeshni.API.Domain.Enums;
namespace Cayeshni.API.Domain.Entities;

public class Friendship
{
    public Guid UserIdA { get; set; }
    public Guid UserIdB { get; set; }

    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
