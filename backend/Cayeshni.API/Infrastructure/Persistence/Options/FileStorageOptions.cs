namespace Cayeshni.API.Infrastructure.Persistence.Options;

public class FileStorageOptions
{
    public const string Section = "FileStorage";

    // Absolute path on disk where files are saved
    public string BasePath { get; set; } = "/app/uploads";

    // Public base URL returned to clients
    public string BaseUrl  { get; set; } = "http://localhost:8080/uploads";
}
