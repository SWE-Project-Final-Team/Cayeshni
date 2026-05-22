using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cayeshni.Domain.Entities;

namespace Cayeshni.Infrastructure.Persistence.Configurations;

public class TransactionMemberConfiguration : IEntityTypeConfiguration<TransactionMember>
{
    public void Configure(EntityTypeBuilder<TransactionMember> builder)
    {
        builder.HasKey(tm => new { tm.TransactionId, tm.UserId });

        builder.Property(tm => tm.AmountOwed)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        // Relationship with Transaction (already configured in TransactionConfiguration with cascade delete)
        builder.HasOne(tm => tm.Transaction)
            .WithMany(t => t.TransactionMembers)
            .HasForeignKey(tm => tm.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(tm => tm.Allocations)
            .WithOne(sa => sa.TransactionMember)
            .HasForeignKey(sa => new { sa.TransactionId, sa.DebtorUserId })
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(tm => tm.UserId);
    }
}


