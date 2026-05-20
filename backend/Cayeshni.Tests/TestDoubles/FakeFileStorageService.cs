using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Domain.Enums;

namespace Cayeshni.Tests.TestDoubles;

/// <summary>Minimal file storage for tests — only <see cref="GetUrl"/> is meaningful for group roster.</summary>
public sealed class FakeFileStorageService : IFileStorageService
{
    public Task DeleteAsync(string fileUrl) => Task.CompletedTask;

    public string GetBaseUrl() => "https://files.test";

    public string GetUrl(string? relativePath, string? defaultName = "avatar") =>
        string.IsNullOrWhiteSpace(relativePath)
            ? $"https://files.test/defaults/{defaultName}.webp"
            : $"https://files.test/{relativePath.Replace("\\", "/")}";

    public Task<string> SaveAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        FileFolder folder) =>
        Task.FromResult($"{folder.ToString().ToLowerInvariant()}/fake-{Guid.NewGuid():N}");
}

