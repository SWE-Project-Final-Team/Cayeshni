using Cayeshni.Application.Features.Auth;
using Microsoft.Extensions.DependencyInjection;

namespace Cayeshni.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();

        // Register other application services, handlers, etc.

        return services;
    }
}