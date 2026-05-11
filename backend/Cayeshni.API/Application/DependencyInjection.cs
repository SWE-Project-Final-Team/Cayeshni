using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Application.Features.Auth;
using Cayeshni.API.Application.Features.Users;
using Cayeshni.API.Application.Features.Groups;
using Cayeshni.API.Application.Features.Users.Friends;
using Microsoft.Extensions.DependencyInjection;

namespace Cayeshni.API.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<UserService>();
        services.AddScoped<IGroupService, GroupService>();
        services.AddScoped<FriendService>();

        // Register other application services, handlers, etc.

        return services;
    }
}
