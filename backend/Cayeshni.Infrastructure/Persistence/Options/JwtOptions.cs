namespace Cayeshni.Infrastructure.Persistence.Options;

public class JwtOptions
{
    public const string Section = "Jwt";

    public string Issuer { get; set; } = null!;
    public string Audience { get; set; } = null!;
    public string Secret { get; set; } = null!;
    public TimeSpan Expiry { get; set; } = TimeSpan.FromMinutes(15); // Default to 15 minutes if not set
    public TimeSpan RefreshExpiry { get; set; } = TimeSpan.FromDays(7); // Default to 7 days if not set
}

