using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cayeshni.Domain.Entities;

namespace Cayeshni.Infrastructure.Persistence.Configurations;

public class GroupMemberConfiguration : IEntityTypeConfiguration<GroupMember>
{
    public void Configure(EntityTypeBuilder<GroupMember> builder)
    {
        builder.HasKey(gm => new { gm.GroupId, gm.UserId });

        builder.Property(gm => gm.JoinedAt)
            .IsRequired();

        // Relationship with Group (already configured in GroupConfiguration with cascade delete)
        builder.HasOne(gm => gm.Group)
            .WithMany(g => g.Members)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(gm => gm.UserId);
        builder.HasIndex(gm => gm.JoinedAt);
    }
}


