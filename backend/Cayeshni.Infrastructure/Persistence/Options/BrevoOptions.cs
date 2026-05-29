namespace Cayeshni.Infrastructure.Persistence.Options;

public class BrevoOptions
{
    public const string Section = "Brevo";

    public string ApiKey    { get; set; } = null!;
    public string FromEmail { get; set; } = null!;
    public string FromName  { get; set; } = "Cayeshni";
}

