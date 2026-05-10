using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Cayeshni.Domain.Enums;
using Cayeshni.Infrastructure.Persistence.Options;
using Cayeshni.Infrastructure.Services;
using Microsoft.Extensions.Options;
using Xunit;

namespace Cayeshni.Tests.Storage;

public class LocalFileStorageServiceTests : IDisposable
{
    private readonly string _basePath;
    private readonly LocalFileStorageService _service;

    public LocalFileStorageServiceTests()
    {
        _basePath = Path.Combine(Path.GetTempPath(), "cayeshni-storage-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_basePath);

        _service = new LocalFileStorageService(Options.Create(new FileStorageOptions
        {
            BasePath = _basePath,
            BaseUrl = "https://cdn.example.com/uploads"
        }));
    }

    [Fact]
    public async Task SaveAsync_WritesFile_AndReturnsRelativeFolderPath()
    {
        await using var input = new MemoryStream(Encoding.UTF8.GetBytes("image-bytes"));

        var relativePath = await _service.SaveAsync(input, "avatar.png", "image/png", FileFolder.Profiles);
        var fullPath = Path.Combine(_basePath, relativePath.Replace('/', Path.DirectorySeparatorChar));

        Assert.StartsWith("profiles/", relativePath.Replace('\\', '/'));
        Assert.EndsWith(".png", relativePath);
        Assert.True(File.Exists(fullPath));
    }

    [Fact]
    public void GetUrl_ReturnsPublicUrl_OnlyWhenFileExists()
    {
        var relativePath = "profiles/test-avatar.png";
        var fullPath = Path.Combine(_basePath, relativePath.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        File.WriteAllText(fullPath, "test");

        var url = _service.GetUrl(relativePath);

        Assert.Equal("https://cdn.example.com/uploads/profiles/test-avatar.png", url);
        Assert.Null(_service.GetUrl("profiles/missing.png"));
    }

    [Fact]
    public async Task DeleteAsync_RemovesFileFromDisk()
    {
        var relativePath = "profiles/to-delete.png";
        var fullPath = Path.Combine(_basePath, relativePath.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        await File.WriteAllTextAsync(fullPath, "delete-me");

        await _service.DeleteAsync(relativePath);

        Assert.False(File.Exists(fullPath));
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_basePath))
            {
                Directory.Delete(_basePath, recursive: true);
            }
        }
        catch
        {
            // best effort cleanup for temp test files
        }
    }
}
