using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cayeshni.Domain.Entities;

namespace Cayeshni.Infrastructure.Persistence.Configurations;

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(g => g.InviteToken)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(g => g.CreatedById)
            .IsRequired();

        builder.Property(g => g.CreatedAt)
            .IsRequired();

        builder.Property(g => g.DefaultCurrency)
            .IsRequired();

        builder.Property(g => g.RowVersion)
            .IsRowVersion();

        // Relationships
        builder.HasMany(g => g.Members)
            .WithOne(gm => gm.Group)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(g => g.Transactions)
            .WithOne(t => t.Group)
            .HasForeignKey(t => t.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(g => g.Settlements)
            .WithOne(s => s.Group)
            .HasForeignKey(s => s.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(g => g.Notifications)
            .WithOne(n => n.Group)
            .HasForeignKey(n => n.GroupId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(g => g.InviteToken).IsUnique();
        builder.HasIndex(g => g.CreatedById);
    }
}
