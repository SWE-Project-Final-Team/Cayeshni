using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Application.Features.Groups;
using Cayeshni.API.Infrastructure.Identity;
using Cayeshni.API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.Tests.Groups;

public class GroupDetailTests
{
    private static AppDbContext GetTestDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static void SeedUser(AppDbContext ctx, Guid id, string email, string name)
    {
        ctx.Users.Add(new AppUser
        {
            Id = id,
            UserName = email,
            NormalizedUserName = email.ToUpperInvariant(),
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            Name = name,
            SecurityStamp = Guid.NewGuid().ToString(),
            EmailConfirmed = true,
        });
    }

    [Fact]
    public async Task GetGroupDetailAsync_UserNotMember_ThrowsNotFoundException()
    {
        var ctx = GetTestDbContext();
        var creatorId = Guid.NewGuid();
        var outsiderId = Guid.NewGuid();
        SeedUser(ctx, creatorId, "c@test.com", "Creator");
        await ctx.SaveChangesAsync();

        var service = new GroupService(ctx);
        var group = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Test Group"));

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetGroupDetailAsync(outsiderId, group.Id));
    }

    [Fact]
    public async Task GetGroupDetailAsync_Member_ReturnsMembersWithDisplayNamesAndCreatorFlag()
    {
        var ctx = GetTestDbContext();
        var creatorId = Guid.NewGuid();
        var joinerId = Guid.NewGuid();
        SeedUser(ctx, creatorId, "c@test.com", "Creator Name");
        SeedUser(ctx, joinerId, "j@test.com", "Joiner Name");
        await ctx.SaveChangesAsync();

        var service = new GroupService(ctx);
        var group = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Trip"));
        await service.JoinGroupAsync(joinerId, new JoinGroupDto(group.InviteToken));

        var detail = await service.GetGroupDetailAsync(joinerId, group.Id);

        Assert.Equal(group.Id, detail.Id);
        Assert.Equal("Trip", detail.Name);
        Assert.Equal(2, detail.Members.Count);
        var creatorRow = detail.Members.Single(m => m.UserId == creatorId);
        Assert.Equal("Creator Name", creatorRow.DisplayName);
        Assert.True(creatorRow.IsCreator);
        var joinerRow = detail.Members.Single(m => m.UserId == joinerId);
        Assert.Equal("Joiner Name", joinerRow.DisplayName);
        Assert.False(joinerRow.IsCreator);
    }

    [Fact]
    public async Task JoinGroupAsync_ReturnsGroupResponseDto()
    {
        var ctx = GetTestDbContext();
        var creatorId = Guid.NewGuid();
        var joinerId = Guid.NewGuid();
        SeedUser(ctx, creatorId, "c@test.com", "C");
        SeedUser(ctx, joinerId, "j@test.com", "J");
        await ctx.SaveChangesAsync();

        var service = new GroupService(ctx);
        var created = await service.CreateGroupAsync(creatorId, new CreateGroupDto("Join Return"));

        var joined = await service.JoinGroupAsync(joinerId, new JoinGroupDto(created.InviteToken));

        Assert.Equal(created.Id, joined.Id);
        Assert.Equal(created.Name, joined.Name);
        Assert.Equal(created.InviteToken, joined.InviteToken);
        Assert.Equal(created.CreatedById, joined.CreatedById);
        Assert.Equal(created.DefaultCurrency, joined.DefaultCurrency);
    }
}
