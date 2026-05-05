using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cayeshni.Domain.Entities;

namespace Cayeshni.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Type)
            .IsRequired();

        builder.Property(n => n.RecipientId)
            .IsRequired();

        builder.Property(n => n.SenderId)
            .IsRequired();

        builder.Property(n => n.Text)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(n => n.IsRead)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(n => n.CreatedAt)
            .IsRequired();

        // Optional Foreign Keys
        builder.Property(n => n.GroupId)
            .IsRequired(false);

        builder.Property(n => n.TransactionId)
            .IsRequired(false);

        builder.Property(n => n.SettlementId)
            .IsRequired(false);

        // Relationships (already partially configured in other configurations with SetNull)
        builder.HasOne(n => n.Group)
            .WithMany(g => g.Notifications)
            .HasForeignKey(n => n.GroupId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(n => n.Transaction)
            .WithMany(t => t.Notifications)
            .HasForeignKey(n => n.TransactionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(n => n.Settlement)
            .WithMany()
            .HasForeignKey(n => n.SettlementId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes for common queries
        builder.HasIndex(n => n.RecipientId);
        builder.HasIndex(n => n.SenderId);
        builder.HasIndex(n => new { n.RecipientId, n.IsRead });
        builder.HasIndex(n => n.CreatedAt);
        builder.HasIndex(n => n.Type);
    }
}
