using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cayeshni.API.Domain.Entities;

namespace Cayeshni.API.Infrastructure.Persistence.Configurations;

public class FriendshipConfiguration : IEntityTypeConfiguration<Friendship>
{
    public void Configure(EntityTypeBuilder<Friendship> builder)
    {
        // Composite key - ensure consistent ordering for bidirectional relationships
        builder.HasKey(f => new { f.UserIdA, f.UserIdB });

        builder.Property(f => f.Status)
            .IsRequired();

        builder.Property(f => f.CreatedAt)
            .IsRequired();

        builder.Property(f => f.UpdatedAt);

        // Indexes for faster lookups
        builder.HasIndex(f => f.UserIdA);
        builder.HasIndex(f => f.UserIdB);
        builder.HasIndex(f => f.Status);
    }
}

