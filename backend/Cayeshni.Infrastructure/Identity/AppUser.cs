using Microsoft.AspNetCore.Identity;

namespace Cayeshni.Infrastructure.Identity;

public class AppUser : IdentityUser<Guid>
{
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
}