using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Features.Groups;
using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Tests.TestDoubles;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Tests.Groups;

public class GroupUpdateTests
{
    private AppDbContext GetTestDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task UpdateGroupAsync_ByCreator_UpdatesGroupName()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(new FakeGroupRepository(context), new FakeFileStorageService());
        var userId = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(userId, new CreateGroupDto("Original Name"));
        var updatedGroupDto = new GroupResponseDto(groupResult.Id, "Updated Name", groupResult.InviteToken, userId, groupResult.DefaultCurrency);

        // Act
        await service.UpdateGroupAsync(userId, updatedGroupDto);

        // Assert
        var group = await context.Groups.FirstOrDefaultAsync(g => g.Id == groupResult.Id);
        Assert.NotNull(group);
        Assert.Equal("Updated Name", group.Name);
    }

    [Fact]
    public async Task UpdateGroupAsync_ByNonCreator_ThrowsValidationException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(new FakeGroupRepository(context), new FakeFileStorageService());
        var creatorId = Guid.NewGuid();
        var nonCreatorId = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Original Name"));
        var updatedGroupDto = new GroupResponseDto(groupResult.Id, "Updated Name", groupResult.InviteToken, creatorId, groupResult.DefaultCurrency);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => service.UpdateGroupAsync(nonCreatorId, updatedGroupDto)
        );
        Assert.Equal("Only the group creator can update this group.", exception.Message);
    }

    [Fact]
    public async Task UpdateGroupAsync_NonExistentGroup_ThrowsNotFoundException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(new FakeGroupRepository(context), new FakeFileStorageService());
        var userId = Guid.NewGuid();
        var groupDto = new GroupResponseDto(Guid.NewGuid(), "Fake", "fake-token", userId, Cayeshni.Domain.Enums.Currency.USD);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => service.UpdateGroupAsync(userId, groupDto)
        );
    }
}


