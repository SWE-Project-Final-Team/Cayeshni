using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Cayeshni.Domain.Entities;

public class SettlementAllocation
{
    public Guid SettlementId { get; set; }
    public Guid TransactionId { get; set; }
    public Guid DebtorUserId { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal AllocatedAmount { get; set; }
    public Settlement Settlement { get; set; } = null!;
    public Transaction Transaction { get; set; } = null!;
    public TransactionMember TransactionMember { get; set; } = null!;
}