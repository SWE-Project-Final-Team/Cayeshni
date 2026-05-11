using Cayeshni.Application.Features.Groups;
using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Tests.Groups;

public class GroupRetrievalTests
{
    private AppDbContext GetTestDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetUserGroupsAsync_UserInMultipleGroups_ReturnsAllUserGroups()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(context);
        var userId = Guid.NewGuid();
        var group1 = await service.CreateGroupAsync(userId, new CreateGroupDto("Group 1"));
        var group2 = await service.CreateGroupAsync(userId, new CreateGroupDto("Group 2"));

        // Act
        var userGroups = await service.GetUserGroupsAsync(userId);

        // Assert
        Assert.Equal(2, userGroups.Count);
        Assert.Contains("Group 1", userGroups.Select(g => g.Name));
        Assert.Contains("Group 2", userGroups.Select(g => g.Name));
    }

    [Fact]
    public async Task GetUserGroupsAsync_UserJoinedGroup_IncludesJoinedGroup()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(context);
        var creatorId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Joined Group"));
        await service.JoinGroupAsync(userId, new JoinGroupDto(groupResult.InviteToken));

        // Act
        var userGroups = await service.GetUserGroupsAsync(userId);

        // Assert
        Assert.Single(userGroups);
        Assert.Equal("Joined Group", userGroups.First().Name);
    }

    [Fact]
    public async Task GetUserGroupsAsync_UserNotInAnyGroup_ReturnsEmptyList()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(context);
        var userId = Guid.NewGuid();

        // Act
        var userGroups = await service.GetUserGroupsAsync(userId);

        // Assert
        Assert.Empty(userGroups);
    }

    [Fact]
    public async Task GetUserGroupsAsync_UserExitsGroup_GroupNotIncluded()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(context);
        var userId = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(userId, new CreateGroupDto("Test Group"));
        var initialGroups = await service.GetUserGroupsAsync(userId);
        Assert.Single(initialGroups);

        // Act
        await service.ExitGroupAsync(userId, groupResult.Id);
        var groupsAfterExit = await service.GetUserGroupsAsync(userId);

        // Assert
        Assert.Empty(groupsAfterExit);
    }
}
