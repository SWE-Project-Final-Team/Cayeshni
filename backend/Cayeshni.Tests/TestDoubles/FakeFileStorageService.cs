using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Domain.Enums;

namespace Cayeshni.Tests.TestDoubles;

/// <summary>Minimal file storage for tests — only <see cref="GetUrl"/> is meaningful for group roster.</summary>
public sealed class FakeFileStorageService : IFileStorageService
{
    public Task DeleteAsync(string fileUrl) => Task.CompletedTask;

    public string? GetUrl(string? profilePicturePath) =>
        string.IsNullOrWhiteSpace(profilePicturePath)
            ? null
            : $"https://files.test/{profilePicturePath.Replace("\\", "/")}";

    public Task<string> SaveAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        FileFolder folder) =>
        Task.FromResult($"{folder.ToString().ToLowerInvariant()}/fake-{Guid.NewGuid():N}");
}
