namespace Cayeshni.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cayeshni.Domain.Enums;


public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GroupId { get; set; }
    [Required]
    public Guid PaidByUserId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }
    public Currency Currency { get; set; }
    public TransactionCategory Category { get; set; } = TransactionCategory.Other;
    [MaxLength(500)]
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Timestamp]
    public byte[]? RowVersion { get; set; }

    public Group Group { get; set; } = null!;
    public ICollection<TransactionMember> TransactionMembers { get; set; } = new List<TransactionMember>();
    public ICollection<SettlementAllocation> Allocations { get; set; } = new List<SettlementAllocation>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

