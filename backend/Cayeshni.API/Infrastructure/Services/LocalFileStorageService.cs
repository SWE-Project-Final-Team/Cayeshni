using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Domain.Enums;
using Cayeshni.API.Infrastructure.Persistence.Options;
using Microsoft.Extensions.Options;

namespace Cayeshni.API.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly FileStorageOptions _options;

    public LocalFileStorageService(IOptions<FileStorageOptions> options)
    {
        _options = options.Value;
        Directory.CreateDirectory(_options.BasePath);
    }

    public async Task<string> SaveAsync(Stream fileStream, string fileName, string contentType, FileFolder folder)
    {
        var folderName = folder.ToString().ToLowerInvariant();
        var folderPath = Path.Combine(_options.BasePath, folderName);
        
        Directory.CreateDirectory(folderPath); // Ensure folder exists

        var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var fullPath = Path.Combine(folderPath, uniqueName);

        await using var fs = File.Create(fullPath);
        await fileStream.CopyToAsync(fs);

        return $"{folderName}/{uniqueName}";
    }

    public Task DeleteAsync(string relativePath)
    {
        var fullPath = Path.Combine(_options.BasePath, relativePath);

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    public string? GetUrl(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return null;

        relativePath = relativePath.Replace("\\", "/").TrimStart('/'); // Ensure URL uses forward slashes
        var fullPath = Path.Combine(_options.BasePath, relativePath);

        if (!File.Exists(fullPath))
            return null;

        return $"{_options.BaseUrl.TrimEnd('/')}/{relativePath}"; 
    }
}
