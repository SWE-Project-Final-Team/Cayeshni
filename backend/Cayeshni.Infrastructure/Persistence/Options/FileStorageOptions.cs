namespace Cayeshni.Infrastructure.Persistence.Options;

public class FileStorageOptions
{
    public const string Section = "FileStorage";
    public string BaseUrl { get; set; } = "http://localhost:8080";
    public int MaxUploadSizeMb { get; set; } = 5;
    public IEnumerable<string> AllowedExtensions { get; set; } = [".jpg", ".jpeg", ".png", ".webp"];
}
