using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Infrastructure.Persistence.Options;
using Microsoft.Extensions.Options;

namespace Cayeshni.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly FileStorageOptions _options;

    public LocalFileStorageService(IOptions<FileStorageOptions> options)
    {
        _options = options.Value;
        Directory.CreateDirectory(_options.BasePath);
    }

    public async Task<string> SaveAsync(
        Stream fileStream, string fileName, string contentType)
    {
        var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var fullPath   = Path.Combine(_options.BasePath, uniqueName);

        await using var fs = File.Create(fullPath);
        await fileStream.CopyToAsync(fs);

        return $"{_options.BaseUrl.TrimEnd('/')}/{uniqueName}";
    }

    public Task DeleteAsync(string fileUrl)
    {
        var fileName = Path.GetFileName(new Uri(fileUrl).LocalPath);
        var fullPath = Path.Combine(_options.BasePath, fileName);

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }
}
