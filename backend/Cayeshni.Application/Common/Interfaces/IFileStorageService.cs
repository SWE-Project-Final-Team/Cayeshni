namespace Cayeshni.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(Stream fileStream, string fileName, string contentType);
    Task DeleteAsync(string fileUrl);
}
