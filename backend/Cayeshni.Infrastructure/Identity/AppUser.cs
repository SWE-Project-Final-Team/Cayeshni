using Cayeshni.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Cayeshni.Infrastructure.Identity;

public class AppUser : IdentityUser<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? ProfilePicturePath { get; set; }
    public Currency PreferredCurrency { get; set; } = Currency.EGP; // Default to EGP
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}