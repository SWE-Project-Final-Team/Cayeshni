using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Application.Features.Users;
using Microsoft.Extensions.DependencyInjection;

namespace Cayeshni.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<UserService>();

        // Register other application services, handlers, etc.

        return services;
    }
}