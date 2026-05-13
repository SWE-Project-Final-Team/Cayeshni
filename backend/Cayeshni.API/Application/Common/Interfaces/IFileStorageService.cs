using Cayeshni.API.Domain.Enums;

namespace Cayeshni.API.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(Stream fileStream, string fileName, string contentType, FileFolder folder);
    Task DeleteAsync(string fileUrl);
    string? GetUrl(string? profilePicturePath);
    string GetBaseUrl();
}
