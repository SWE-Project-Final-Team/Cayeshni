using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;

namespace Cayeshni.Application.Features.Users;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IFileStorageService _fileStorageService;

    public UserService(IUserRepository userRepository, IFileStorageService fileStorage)
    {
        _userRepository = userRepository;
        _fileStorageService = fileStorage;
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId)
        => await _userRepository.GetProfileAsync(userId)
            ?? throw new NotFoundException("User", userId);

    public async Task UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
    {
        var name = dto.Name?.Trim();

        if (string.IsNullOrWhiteSpace(name) || name.Length < 3)
            throw new ValidationException("Name must be at least 3 characters.");

        await _userRepository.UpdateProfileAsync(userId, name, dto.PreferredCurrency);
    }

    public async Task<string> UploadPictureAsync(Guid userId, Stream fileStream, string fileName, string contentType)
    {
        var newUrl = await _fileStorageService.SaveAsync(fileStream, fileName, contentType);

        // Delete old picture if exists
        var oldUrl = await _userRepository.GetPictureUrlAsync(userId);
        if (oldUrl != null)
            await _fileStorageService.DeleteAsync(oldUrl);

        await _userRepository.UpdatePictureAsync(userId, newUrl);

        return newUrl;
    }

    public async Task DeletePictureAsync(Guid userId)
    {
        var oldUrl = await _userRepository.GetPictureUrlAsync(userId);
        if (string.IsNullOrEmpty(oldUrl))
            return; // No picture to delete

        await _fileStorageService.DeleteAsync(oldUrl);
        await _userRepository.UpdatePictureAsync(userId, null);
    }
}
