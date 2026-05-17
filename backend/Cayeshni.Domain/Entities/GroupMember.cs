namespace Cayeshni.Domain.Entities;

public class GroupMember
{
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public Group Group { get; set; } = null!;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

