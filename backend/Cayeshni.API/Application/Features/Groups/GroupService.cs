using Cayeshni.API.Application.Common.Exceptions;

namespace Cayeshni.API.Application.Features.Groups;

/// <summary>
/// Application-layer validation and facade for group operations.
/// This layer ensures business rule validation before delegating to infrastructure services.
/// </summary>
public static class GroupServiceValidation
{
    public static CreateGroupDto ValidateCreateGroupDto(CreateGroupDto dto)
    {
        var name = dto.Name.Trim();

        if (string.IsNullOrWhiteSpace(name) || name.Length < 3)
            throw new ValidationException("Group name must be at least 3 characters.");

        return dto with { Name = name };
    }
}
