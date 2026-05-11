using System.ComponentModel.DataAnnotations;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Domain.Enums;
using Cayeshni.Infrastructure.Persistence.Options;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;

public class LocalFileStorageService : IFileStorageService
{
    private readonly FileStorageOptions _options;
    private readonly string _basePath;

    public LocalFileStorageService(IWebHostEnvironment env, IOptions<FileStorageOptions> options)
    {
        _options = options.Value;
        _basePath = Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveAsync(Stream fileStream, string fileName, string contentType, FileFolder folder)
    {    
        // size validation
        if (fileStream.Length > _options.MaxUploadSizeMb * 1024 * 1024)
            throw new ValidationException($"File too large. Max {_options.MaxUploadSizeMb}MB allowed.");

        // extension validation
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        if (!_options.AllowedExtensions.Contains(extension))
            throw new ValidationException($"Invalid file type. Allowed types: {string.Join(", ", _options.AllowedExtensions)}");

        var folderName = folder.ToString().ToLowerInvariant();
        var folderPath = Path.Combine(_basePath, folderName);

        Directory.CreateDirectory(folderPath);

        var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var fullPath = Path.Combine(folderPath, uniqueName);

        await using var fs = File.Create(fullPath);
        await fileStream.CopyToAsync(fs);

        return $"{folderName}/{uniqueName}";
    }

    public Task DeleteAsync(string relativePath)
    {
        var fullPath = Path.GetFullPath(Path.Combine(_basePath, relativePath));

        if (!fullPath.StartsWith(_basePath, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Invalid path");

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    public string GetUrl(string relativePath)
    {
        return $"{_options.BaseUrl.TrimEnd('/')}/uploads/{relativePath.Replace("\\", "/").TrimStart('/')}";
    }

    public string GetBaseUrl() => _options.BaseUrl.TrimEnd('/');
}
