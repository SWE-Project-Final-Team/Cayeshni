using Microsoft.Extensions.DependencyInjection;

namespace Cayeshni.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // services.AddScoped<IExampleService, ExampleService>();
        // Register other application services, handlers, etc.

        return services;
    }
}