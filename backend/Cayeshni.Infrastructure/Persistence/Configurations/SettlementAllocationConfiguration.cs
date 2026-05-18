using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cayeshni.Domain.Entities;

namespace Cayeshni.Infrastructure.Persistence.Configurations;

public class SettlementAllocationConfiguration : IEntityTypeConfiguration<SettlementAllocation>
{
    public void Configure(EntityTypeBuilder<SettlementAllocation> builder)
    {
        builder.HasKey(sa => new { sa.SettlementId, sa.TransactionId, sa.DebtorUserId });

        builder.Property(sa => sa.AllocatedAmount)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(sa => sa.DebtorUserId)
            .IsRequired();

        // Relationships
        builder.HasOne(sa => sa.Settlement)
            .WithMany(s => s.Allocations)
            .HasForeignKey(sa => sa.SettlementId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sa => sa.Transaction)
            .WithMany(t => t.Allocations)
            .HasForeignKey(sa => sa.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sa => sa.TransactionMember)
            .WithMany(tm => tm.Allocations)
            .HasForeignKey(sa => new { sa.TransactionId, sa.DebtorUserId })
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(sa => new { sa.SettlementId, sa.DebtorUserId });
        builder.HasIndex(sa => sa.DebtorUserId);
    }
}


