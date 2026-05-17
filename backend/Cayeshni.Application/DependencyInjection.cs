using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Application.Features.Users;
using Cayeshni.Application.Features.Groups;
using Cayeshni.Application.Features.Friends;
using Cayeshni.Application.Features.Settlements;
using Cayeshni.Application.Features.Transactions;
using Cayeshni.Application.Features.Dashboard;
using Microsoft.Extensions.DependencyInjection;
// infrastructure implementations are registered in Infrastructure project

namespace Cayeshni.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<UserService>();
        services.AddScoped<UserService>();
        services.AddScoped<GroupService>();
        services.AddScoped<FriendService>();
        services.AddScoped<SettlementService>();
        services.AddScoped<TransactionService>();
        services.AddScoped<DashboardService>();

        // Register other application services, handlers, etc.

        return services;
    }
}

