using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cayeshni.API.Domain.Entities;

namespace Cayeshni.API.Infrastructure.Persistence.Configurations;

public class SettlementConfiguration : IEntityTypeConfiguration<Settlement>
{
    public void Configure(EntityTypeBuilder<Settlement> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.GroupId)
            .IsRequired();

        builder.Property(s => s.PayerUserId)
            .IsRequired();

        builder.Property(s => s.PayeeUserId)
            .IsRequired();

        builder.Property(s => s.Amount)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(s => s.Currency)
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        builder.Property(s => s.note)
            .HasMaxLength(300);

        // Relationships
        builder.HasOne(s => s.Group)
            .WithMany(g => g.Settlements)
            .HasForeignKey(s => s.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Allocations)
            .WithOne(sa => sa.Settlement)
            .HasForeignKey(sa => sa.SettlementId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(s => s.GroupId);
        builder.HasIndex(s => s.PayerUserId);
        builder.HasIndex(s => s.PayeeUserId);
        builder.HasIndex(s => new { s.PayerUserId, s.PayeeUserId });
    }
}

