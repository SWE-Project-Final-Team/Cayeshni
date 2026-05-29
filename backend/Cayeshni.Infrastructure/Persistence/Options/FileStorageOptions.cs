namespace Cayeshni.Infrastructure.Persistence.Options;

public class FileStorageOptions
{
    public const string Section = "FileStorage";

    // Absolute path on disk where files are saved
    public string BasePath { get; set; } = "uploads";
    public int MaxUploadSizeMb { get; set; } = 5;
    public List<string> AllowedExtensions { get; set; } = new() { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

    // Public base URL returned to clients
    public string BaseUrl  { get; set; } = "http://localhost:8080";

    public string Provider { get; set; } = "Local"; // "Local" or "Cloudinary"
}

