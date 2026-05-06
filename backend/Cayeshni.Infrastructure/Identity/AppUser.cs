using Microsoft.AspNetCore.Identity;

namespace Cayeshni.Infrastructure.Identity;

public class AppUser : IdentityUser
{
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}