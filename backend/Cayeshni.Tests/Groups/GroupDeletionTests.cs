using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Application.Features.Group;
using Cayeshni.API.Infrastructure.Persistence;
using Cayeshni.API.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Tests.Groups;

public class GroupDeletionTests
{
    private AppDbContext GetTestDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task DeleteGroupAsync_ByCreator_DeletesGroupAndMembers()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(context);
        var userId = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(userId, new CreateGroupDto("Delete Test"));
        var groupDto = new GroupResponseDto(groupResult.Id, groupResult.Name, groupResult.InviteToken, groupResult.CreatedById, groupResult.DefaultCurrency);

        // Act
        await service.DeleteGroupAsync(userId, groupDto);

        // Assert
        var group = await context.Groups.FirstOrDefaultAsync(g => g.Id == groupResult.Id);
        Assert.Null(group);
    }

    [Fact]
    public async Task DeleteGroupAsync_ByNonCreator_ThrowsValidationException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(context);
        var creatorId = Guid.NewGuid();
        var nonCreatorId = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Delete Test"));
        var groupDto = new GroupResponseDto(groupResult.Id, groupResult.Name, groupResult.InviteToken, groupResult.CreatedById, groupResult.DefaultCurrency);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => service.DeleteGroupAsync(nonCreatorId, groupDto)
        );
        Assert.Equal("Only the group creator can delete this group.", exception.Message);
    }

    [Fact]
    public async Task DeleteGroupAsync_NonExistentGroup_ThrowsNotFoundException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(context);
        var userId = Guid.NewGuid();
        var nonExistentGroupId = Guid.NewGuid();
        var groupDto = new GroupResponseDto(nonExistentGroupId, "Fake", "fake-token", userId, Cayeshni.API.Domain.Enums.Currency.USD);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => service.DeleteGroupAsync(userId, groupDto)
        );
    }

    [Fact]
    public async Task DeleteGroupAsync_WithMembers_RemovesAllMembers()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(context);
        var creatorId = Guid.NewGuid();
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Multi Member Group"));
        await service.JoinGroupAsync(userId1, new JoinGroupDto(groupResult.InviteToken));
        await service.JoinGroupAsync(userId2, new JoinGroupDto(groupResult.InviteToken));

        var groupDto = new GroupResponseDto(groupResult.Id, groupResult.Name, groupResult.InviteToken, groupResult.CreatedById, groupResult.DefaultCurrency);

        // Act
        await service.DeleteGroupAsync(creatorId, groupDto);

        // Assert
        var members = await context.GroupMembers
            .Where(m => m.GroupId == groupResult.Id)
            .ToListAsync();
        Assert.Empty(members);
    }
}

