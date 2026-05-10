using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Features.Groups;
using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Tests.Groups;

public class GroupJoinExitTests
{
    private AppDbContext GetTestDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    #region JoinGroupAsync Tests

    [Fact]
    public async Task JoinGroupAsync_WithValidToken_AddsUserToGroup()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupManagementService(context);
        var creatorId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Join Test"));

        // Act
        await service.JoinGroupAsync(userId, new JoinGroupDto(groupResult.InviteToken));

        // Assert
        var group = await context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupResult.Id);
        
        Assert.NotNull(group);
        Assert.Equal(2, group.Members.Count);
        Assert.Contains(userId, group.Members.Select(m => m.UserId));
    }

    [Fact]
    public async Task JoinGroupAsync_UserAlreadyMember_ThrowsValidationException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupManagementService(context);
        var userId = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(userId, new CreateGroupDto("Join Test"));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => service.JoinGroupAsync(userId, new JoinGroupDto(groupResult.InviteToken))
        );
        Assert.Equal("User already joined this group.", exception.Message);
    }

    [Fact]
    public async Task JoinGroupAsync_InvalidToken_ThrowsNotFoundException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupManagementService(context);
        var userId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => service.JoinGroupAsync(userId, new JoinGroupDto("invalid-token"))
        );
    }

    #endregion

    #region ExitGroupAsync Tests

    [Fact]
    public async Task ExitGroupAsync_NonCreatorLeaves_GroupStaysAndMemberRemoved()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupManagementService(context);
        var creatorId = Guid.NewGuid();
        var userId1 = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Exit Test"));
        await service.JoinGroupAsync(userId1, new JoinGroupDto(groupResult.InviteToken));

        // Act
        await service.ExitGroupAsync(userId1, groupResult.Id);

        // Assert
        var group = await context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupResult.Id);
        
        Assert.NotNull(group);
        Assert.Single(group.Members);
        Assert.Equal(creatorId, group.Members.First().UserId);
    }

    [Fact]
    public async Task ExitGroupAsync_LastMemberLeaves_GroupIsDeleted()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupManagementService(context);
        var userId = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(userId, new CreateGroupDto("Exit Test"));

        // Act
        await service.ExitGroupAsync(userId, groupResult.Id);

        // Assert
        var group = await context.Groups.FirstOrDefaultAsync(g => g.Id == groupResult.Id);
        Assert.Null(group);
    }

    [Fact]
    public async Task ExitGroupAsync_CreatorLeavesWithMultipleMembers_TransfersCreatorshipToEarliestJoined()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupManagementService(context);
        var creatorId = Guid.NewGuid();
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Inheritance Test"));
        
        // Add members in order
        await service.JoinGroupAsync(userId1, new JoinGroupDto(groupResult.InviteToken));
        await service.JoinGroupAsync(userId2, new JoinGroupDto(groupResult.InviteToken));

        // Act - Creator leaves
        await service.ExitGroupAsync(creatorId, groupResult.Id);

        // Assert - Creator should transfer to userId1 (earliest joined)
        var group = await context.Groups.FirstOrDefaultAsync(g => g.Id == groupResult.Id);
        Assert.NotNull(group);
        Assert.Equal(userId1, group.CreatedById);
        Assert.Equal(2, group.Members.Count);
    }

    [Fact]
    public async Task ExitGroupAsync_NonExistentGroup_ThrowsNotFoundException()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupManagementService(context);
        var userId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => service.ExitGroupAsync(userId, Guid.NewGuid())
        );
    }

    [Fact]
    public async Task ExitGroupAsync_CreatorInheritanceChain_TransfersToNextEarliestAfterFirstLeaves()
    {
        // Arrange
        var context = GetTestDbContext();
        var service = new GroupManagementService(context);
        var creatorId = Guid.NewGuid();
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var userId3 = Guid.NewGuid();
        var groupResult = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Chain Test"));
        
        await service.JoinGroupAsync(userId1, new JoinGroupDto(groupResult.InviteToken));
        await service.JoinGroupAsync(userId2, new JoinGroupDto(groupResult.InviteToken));
        await service.JoinGroupAsync(userId3, new JoinGroupDto(groupResult.InviteToken));

        // Act - Creator leaves
        await service.ExitGroupAsync(creatorId, groupResult.Id);
        var groupAfterFirstExit = await context.Groups.FirstOrDefaultAsync(g => g.Id == groupResult.Id);
        Assert.Equal(userId1, groupAfterFirstExit!.CreatedById);

        // Act - First inheritor leaves
        await service.ExitGroupAsync(userId1, groupResult.Id);

        // Assert - Creator should transfer to userId2
        var groupAfterSecondExit = await context.Groups.FirstOrDefaultAsync(g => g.Id == groupResult.Id);
        Assert.NotNull(groupAfterSecondExit);
        Assert.Equal(userId2, groupAfterSecondExit.CreatedById);
        Assert.Equal(2, groupAfterSecondExit.Members.Count);
    }

    #endregion
}
