using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Cayeshni.API.Infrastructure.Identity;
using Cayeshni.API.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace Cayeshni.API.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<Friendship> Friendships => Set<Friendship>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<TransactionMember> TransactionMembers => Set<TransactionMember>();
    public DbSet<Settlement> Settlements => Set<Settlement>();
    public DbSet<SettlementAllocation> SettlementAllocations => Set<SettlementAllocation>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Configure migrations location
        builder.HasAnnotation("Relational:Migrations:MigrationsHistoryTable", "__EFMigrationsHistory");

        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
    }
}
