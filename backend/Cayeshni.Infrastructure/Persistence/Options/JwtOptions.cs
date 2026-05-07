namespace Cayeshni.Infrastructure.Persistence.Options;

public class JwtOptions
{
    public string Issuer { get; set; } = null!;
    public string Audience { get; set; } = null!;
    public string Secret { get; set; } = null!;
    public TimeSpan Expiry { get; set; } = TimeSpan.FromMinutes(30); // Default to 30 minutes if not set
}