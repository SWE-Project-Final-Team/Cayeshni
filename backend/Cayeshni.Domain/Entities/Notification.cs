using Cayeshni.API.Domain.Enums;
using System.ComponentModel.DataAnnotations;
namespace Cayeshni.API.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public NotificationType Type { get; set; }
    [Required]
    public Guid RecipientId { get; set; }
    [Required]
    public Guid SenderId { get; set; }

    public Guid? GroupId { get; set; }
    public Guid? TransactionId { get; set; }
    public Guid? SettlementId { get; set; }

    [Required, MaxLength(500)]
    public string Text { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Group? Group { get; set; }
    public Transaction? Transaction { get; set; }
    public Settlement? Settlement { get; set; }
    
}
