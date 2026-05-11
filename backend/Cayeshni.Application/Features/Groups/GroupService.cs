using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Domain.Entities;

namespace Cayeshni.Application.Features.Groups;

public class GroupService : IGroupService
{
    private readonly IGroupRepository _repository;

    public GroupService(IGroupRepository repository)
    {
        _repository = repository;
    }

    public async Task<GroupResponseDto> CreateGroupAsync(Guid userId, CreateGroupDto dto)
    {
        var name = dto.Name.Trim();

        if (string.IsNullOrWhiteSpace(name) || name.Length < 3)
            throw new ValidationException("Group name must be at least 3 characters.");

        var group = new Group
        {
            Name = name,
            DefaultCurrency = dto.DefaultCurrency,
            CreatedById = userId
        };

        group.Members.Add(new GroupMember
        {
            GroupId = group.Id,
            UserId = userId
        });

        await _repository.AddAsync(group);
        await _repository.SaveChangesAsync();

        return new GroupResponseDto(
            group.Id,
            group.Name,
            group.InviteToken,
            group.CreatedById,
            group.DefaultCurrency
        );
    }

    public async Task JoinGroupAsync(Guid userId, JoinGroupDto dto)
    {
        var group = await _repository.FindByInviteTokenAsync(dto.InviteToken)
            ?? throw new NotFoundException(nameof(Group), dto.InviteToken);

        var alreadyMember = group.Members.Any(m => m.UserId == userId);
        if (alreadyMember)
            throw new ValidationException("User already joined this group.");

        group.Members.Add(new GroupMember
        {
            GroupId = group.Id,
            UserId = userId
        });

        await _repository.SaveChangesAsync();
    }

    public async Task ExitGroupAsync(Guid userId, Guid groupId)
    {
        var group = await _repository.FindByIdIncludeMembersAsync(groupId)
            ?? throw new NotFoundException(nameof(Group), groupId);

        var membership = group.Members.FirstOrDefault(m => m.UserId == userId)
            ?? throw new Exception("Membership not found.");

        _repository.RemoveGroupMember(membership);

        if (group.Members.Count == 1)
        {
            _repository.RemoveGroup(group);
        }
        else if (group.CreatedById == userId)
        {
            var nextCreator = group.Members
                .Where(m => m.UserId != userId)
                .OrderBy(m => m.JoinedAt)
                .First();

            group.CreatedById = nextCreator.UserId;
        }

        await _repository.SaveChangesAsync();
    }

    public async Task<List<GroupResponseDto>> GetUserGroupsAsync(Guid userId)
    {
        var groups = await _repository.GetUserGroupsAsync(userId);

        return groups.Select(g => new GroupResponseDto(
            g.Id,
            g.Name,
            g.InviteToken,
            g.CreatedById,
            g.DefaultCurrency
        )).ToList();
    }

    public async Task DeleteGroupAsync(Guid userId, GroupResponseDto group)
    {
        var entity = await _repository.FindByIdIncludeMembersAsync(group.Id)
            ?? throw new NotFoundException(nameof(Group), group.Id);

        if (entity.CreatedById != userId)
            throw new ValidationException("Only the group creator can delete this group.");

        _repository.RemoveGroupMembersRange(entity.Members);
        _repository.RemoveGroup(entity);
        await _repository.SaveChangesAsync();
    }

    public async Task UpdateGroupAsync(Guid userId, GroupResponseDto group)
    {
        var entity = await _repository.FindByIdIncludeMembersAsync(group.Id)
            ?? throw new NotFoundException(nameof(Group), group.Id);

        if (entity.CreatedById != userId)
            throw new ValidationException("Only the group creator can update this group.");

        entity.Name = group.Name;
        entity.DefaultCurrency = group.DefaultCurrency;
        await _repository.SaveChangesAsync();
    }
}
