using System.ComponentModel.DataAnnotations.Schema;

namespace Cayeshni.API.Domain.Entities;

public class TransactionMember
{
    public Guid TransactionId { get; set; }
    public Guid UserId { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal AmountOwed { get; set; }
    public Transaction Transaction { get; set; } = null!;
    public ICollection<SettlementAllocation> Allocations { get; set; } = new List<SettlementAllocation>();
}
