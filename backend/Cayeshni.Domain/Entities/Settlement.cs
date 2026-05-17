using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Cayeshni.Domain.Enums;

namespace Cayeshni.Domain.Entities;
public class Settlement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GroupId { get; set; }
    [Required]
    public Guid PayerUserId { get; set; }
    [Required]
    public Guid PayeeUserId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public Currency Currency { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(300)]
    public string? note { get; set; }

    public Group Group { get; set; } = null!;
    public ICollection<SettlementAllocation> Allocations { get; set; } = new List<SettlementAllocation>();
}

