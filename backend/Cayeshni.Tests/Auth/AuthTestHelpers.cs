using System;
using System.Security.Claims;
using Cayeshni.API.Controller;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Infrastructure.Identity;
using Cayeshni.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Cayeshni.Tests.Auth;

public static class AuthTestHelpers
{
    public static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    public static UserManager<AppUser> CreateUserManager(AppDbContext ctx)
    {
        var store = new UserStore<AppUser, IdentityRole<Guid>, AppDbContext, Guid>(ctx);
        var provider = new ServiceCollection().BuildServiceProvider();

        return new UserManager<AppUser>(
            store,
            Options.Create(new IdentityOptions()),
            new PasswordHasher<AppUser>(),
            Array.Empty<IUserValidator<AppUser>>(),
            Array.Empty<IPasswordValidator<AppUser>>(),
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            provider,
            new Logger<UserManager<AppUser>>(new LoggerFactory()));
    }

    public static AppUser CreateUser(string refreshToken, DateTime expiry, string email = "x@test.com", string name = "X")
        => new()
        {
            Id = Guid.NewGuid(),
            Email = email,
            UserName = email,
            Name = name,
            RefreshToken = refreshToken,
            RefreshTokenExpiry = expiry,
            SecurityStamp = Guid.NewGuid().ToString()
        };

    public static AuthController CreateController(IIdentityService identityService)
        => new(new AuthService(identityService));

    public static ControllerContext CreateControllerContext(ClaimsPrincipal? user = null)
        => new()
        {
            HttpContext = new DefaultHttpContext { User = user ?? new ClaimsPrincipal() }
        };

    public static ClaimsPrincipal PrincipalWithClaim(string type, string value)
        => new(new ClaimsIdentity(new[] { new Claim(type, value) }));
}
