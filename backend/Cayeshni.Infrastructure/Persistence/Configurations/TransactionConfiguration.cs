using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cayeshni.Domain.Entities;

namespace Cayeshni.Infrastructure.Persistence.Configurations;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.GroupId)
            .IsRequired();

        builder.Property(t => t.PaidByUserId)
            .IsRequired();

        builder.Property(t => t.TotalAmount)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(t => t.Currency)
            .IsRequired();

        builder.Property(t => t.Category)
            .IsRequired();

        builder.Property(t => t.Description)
            .HasMaxLength(500);

        builder.Property(t => t.RowVersion)
            .IsRowVersion();

        // Relationships
        builder.HasOne(t => t.Group)
            .WithMany(g => g.Transactions)
            .HasForeignKey(t => t.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.TransactionMembers)
            .WithOne(tm => tm.Transaction)
            .HasForeignKey(tm => tm.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Allocations)
            .WithOne(sa => sa.Transaction)
            .HasForeignKey(sa => sa.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Notifications)
            .WithOne(n => n.Transaction)
            .HasForeignKey(n => n.TransactionId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(t => t.GroupId);
        builder.HasIndex(t => t.PaidByUserId);
        builder.HasIndex(t => t.Category);
    }
}


