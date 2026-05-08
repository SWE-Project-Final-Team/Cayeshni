using System.ComponentModel.DataAnnotations;
using Cayeshni.Domain.Enums;

namespace Cayeshni.Domain.Entities;
public class Group
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    public Currency DefaultCurrency { get; set; } = Currency.USD;

    [Required, MaxLength(64)]
    public string InviteToken { get; set; } = Guid.NewGuid().ToString("N"); // N format for compact representation without hyphens

    public Guid CreatedById { get; set; }

    public DateTime CreatedAt {get; set;} = DateTime.UtcNow;

    [Timestamp]
    public byte[]? RowVersion { get; set; } 

    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Settlement> Settlements { get; set; } = new List<Settlement>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
