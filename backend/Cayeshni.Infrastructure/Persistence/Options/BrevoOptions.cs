namespace Cayeshni.API.Infrastructure.Persistence.Options;

public class DatabaseOptions
{
    public const string Section = "Database";

    public string Host { get; set; } = null!;
    public string Port { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string User { get; set; } = null!;
    public string Password { get; set; } = null!;

    public string ToConnectionString() =>
        $"Host={Host};Port={Port};Database={Name};Username={User};Password={Password}";
}
