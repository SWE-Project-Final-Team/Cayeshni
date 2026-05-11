using Cayeshni.Application.Common.Exceptions;

namespace Cayeshni.Application.Features.Groups;

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
