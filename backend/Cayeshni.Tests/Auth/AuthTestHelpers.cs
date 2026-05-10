using System;
using System.Collections.Generic;
using System.Security.Claims;
using Cayeshni.API.Controllers;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Infrastructure.Identity;
using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Infrastructure.Persistence.Options;
using Cayeshni.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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

    public static AppUser CreateUser(string email = "x@test.com", string name = "X")
        => new()
        {
            Id = Guid.NewGuid(),
            Email = email,
            UserName = email,
            Name = name,
            SecurityStamp = Guid.NewGuid().ToString()
        };

    public static AuthController CreateController(IIdentityService identityService)
    {
        var controller = new AuthController(new AuthService(identityService), new Cayeshni.API.Services.CookieService(new Cayeshni.Infrastructure.Persistence.Options.JwtOptions { RefreshExpiry = TimeSpan.FromDays(7) }));
        controller.ControllerContext = CreateControllerContext();
        return controller;
    }

    public static ControllerContext CreateControllerContext(ClaimsPrincipal? user = null)
    {
        return new()
        {
            HttpContext = new DefaultHttpContext { User = user ?? new ClaimsPrincipal() }
        };
    }

    public static ClaimsPrincipal PrincipalWithClaim(string type, string value)
        => new(new ClaimsIdentity(new[] { new Claim(type, value) }));

    public static IdentityService CreateIdentityService(
        AppDbContext ctx,
        bool requireEmailConfirmation = false,
        IEmailService? emailService = null,
        JwtOptions? jwtOptions = null)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["App:FrontendUrl"] = "http://localhost:3000",
                ["RequireEmailConfirmation"] = requireEmailConfirmation.ToString(),
            })
            .Build();

        var options = jwtOptions ?? new JwtOptions
        {
            Issuer = "test-issuer",
            Audience = "test-audience",
            Secret = "super-secret-key-super-secret-key-super-secret-key",
            Expiry = TimeSpan.FromMinutes(15),
            RefreshExpiry = TimeSpan.FromDays(7),
        };

        return new IdentityService(
            CreateUserManager(ctx),
            new JwtService(options),
            emailService ?? new RecordingEmailService(),
            new Logger<IdentityService>(new LoggerFactory()),
            configuration);
    }

    public sealed class RecordingEmailService : IEmailService
    {
        public int SendCount { get; private set; }
        public string? LastTo { get; private set; }
        public string? LastSubject { get; private set; }
        public string? LastHtmlBody { get; private set; }

        public Task SendAsync(string to, string subject, string htmlBody)
        {
            SendCount++;
            LastTo = to;
            LastSubject = subject;
            LastHtmlBody = htmlBody;
            return Task.CompletedTask;
        }
    }
}
