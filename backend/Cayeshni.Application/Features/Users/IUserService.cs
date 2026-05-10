namespace Cayeshni.Application.Features.Users;

public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(Guid userId);
    Task UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
    Task<UploadPictureResponseDto> UploadPictureAsync(Guid userId, Stream fileStream, string fileName, string contentType);
    Task DeletePictureAsync(Guid userId);
}