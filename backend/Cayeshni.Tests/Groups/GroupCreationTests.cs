using Cayeshni.Application.Features.Groups;
using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Tests.TestDoubles;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Tests.Groups;

public class GroupCreationTests
{
    private AppDbContext GetTestDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateGroupAsync_WithValidData_CreatesGroupAndAddsCreatorAsMember()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(new FakeGroupRepository(context), new FakeFileStorageService());
        var userId = Guid.NewGuid();
        var createGroupDto = new CreateGroupDto("Test Group");

        // Act
        var result = await service.CreateGroupAsync(userId, createGroupDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Group", result.Name);
        Assert.Equal(userId, result.CreatedById);
        
        var group = await context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == result.Id);
        
        Assert.NotNull(group);
        Assert.Single(group.Members);
        Assert.Equal(userId, group.Members.First().UserId);
    }

    [Fact]
    public async Task CreateGroupAsync_GeneratesInviteToken()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(new FakeGroupRepository(context), new FakeFileStorageService());
        var userId = Guid.NewGuid();

        // Act
        var result = await service.CreateGroupAsync(userId, new CreateGroupDto("Group 1"));

        // Assert
        Assert.NotEmpty(result.InviteToken);
        Assert.Equal(8, result.InviteToken.Length); // Base58 encoded hash is 8 chars
    }

    [Fact]
    public async Task CreateGroupAsync_MultipleGroups_AllCreatedSuccessfully()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupService(new FakeGroupRepository(context), new FakeFileStorageService());
        var userId = Guid.NewGuid();

        // Act
        var group1 = await service.CreateGroupAsync(userId, new CreateGroupDto("Group 1"));
        var group2 = await service.CreateGroupAsync(userId, new CreateGroupDto("Group 2"));

        // Assert
        Assert.NotEqual(group1.Id, group2.Id);
        Assert.NotEqual(group1.InviteToken, group2.InviteToken);
    }
}


