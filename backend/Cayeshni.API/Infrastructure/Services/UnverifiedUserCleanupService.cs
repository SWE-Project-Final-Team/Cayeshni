using Cayeshni.API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Cayeshni.API.Infrastructure.Services;

/// <summary>
/// Periodically deletes unconfirmed accounts older than the cutoff (matches backend_ref behavior).
/// </summary>
public class UnverifiedUserCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;

    public UnverifiedUserCleanupService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var cutoff = DateTime.UtcNow.AddDays(-3);

            await db.Users
                .Where(u => !u.EmailConfirmed && u.CreatedAt < cutoff)
                .ExecuteDeleteAsync(stoppingToken);

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
