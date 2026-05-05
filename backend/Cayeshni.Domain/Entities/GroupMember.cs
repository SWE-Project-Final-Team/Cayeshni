namespace Cayeshni.Domain.Entities;

public class GroupMember
{
    public Guid GroupId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Group Group { get; set; } = null!;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}