using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cayeshni.Infrastructure.Identity;

namespace Cayeshni.Infrastructure.Persistence.Configurations;

public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.Property(u => u.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.ProfilePicturePath)
            .HasMaxLength(500);

        builder.Property(u => u.PreferredCurrency)
            .HasConversion<string>() // Store enum as string
            .HasMaxLength(10);

        builder.Property(u => u.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAdd(); 

        builder.HasIndex(u => u.NormalizedEmail)
            .IsUnique();
        builder.HasIndex(u => new { u.EmailConfirmed, u.CreatedAt }); // For fast cleaning of unconfirmed accounts
    }
}