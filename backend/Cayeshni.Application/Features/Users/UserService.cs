using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Domain.Enums;

namespace Cayeshni.Application.Features.Users;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IProfileImageProcessor _profileImageProcessor;

    public UserService(IUserRepository userRepository, IFileStorageService fileStorage, IProfileImageProcessor profileImageProcessor)
    {
        _userRepository = userRepository;
        _fileStorageService = fileStorage;
        _profileImageProcessor = profileImageProcessor;
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        var pictureUrl = string.IsNullOrEmpty(user.ProfilePicturePath)
            ? $"{_fileStorageService.GetBaseUrl()}/defaults/avatar.webp" // default picture
            : _fileStorageService.GetUrl(user.ProfilePicturePath);

        return new UserProfileDto(
            Id: user.Id,
            Name: user.Name,
            Email: user.Email,
            ProfilePictureUrl: pictureUrl,
            PreferredCurrency: user.PreferredCurrency,
            CreatedAt: user.CreatedAt
        );
    }

    public async Task UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
    {
        var name = dto.Name?.Trim();

        if (string.IsNullOrWhiteSpace(name) || name.Length < 3)
            throw new ValidationException("Name must be at least 3 characters.");

        await _userRepository.UpdateProfileAsync(userId, name, dto.PreferredCurrency);
    }

    public async Task<UploadPictureResponseDto> UploadPictureAsync(Guid userId, Stream fileStream, string fileName, string contentType)
    {
        // Process image (resize and convert to webp)
        var processedStream = await _profileImageProcessor.ProcessAsync(fileStream);

        var webpFileName = $"{Guid.NewGuid()}.webp";
        var newPath = await _fileStorageService.SaveAsync(processedStream, webpFileName, "image/webp", FileFolder.Profiles);

        // delete old picture if exists
        var oldPath = await _userRepository.GetPicturePathAsync(userId);
        if (!string.IsNullOrEmpty(oldPath))
            await _fileStorageService.DeleteAsync(oldPath);

        await _userRepository.UpdatePictureAsync(userId, newPath);

        var pictureUrl = _fileStorageService.GetUrl(newPath);
        return new UploadPictureResponseDto ( PictureUrl: pictureUrl );
    }

    public async Task DeletePictureAsync(Guid userId)
    {
        var oldPath = await _userRepository.GetPicturePathAsync(userId);

        if (string.IsNullOrEmpty(oldPath))
            return;

        await _fileStorageService.DeleteAsync(oldPath);
        await _userRepository.UpdatePictureAsync(userId, null);
    }
}