using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Cayeshni.API.Infrastructure.Identity;
using Cayeshni.API.Domain.Entities;
using Cayeshni.API.Domain.Enums;

namespace Cayeshni.API.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var userManager = services.GetRequiredService<UserManager<AppUser>>();

        if (await db.Users.AnyAsync())
        {
            return; // DB has been seeded
        }

        // ── USERS ───────────────────────────────
        var alice = await CreateUser(userManager, "alice@cayeshni.com", "Alice Johnson");
        var bob = await CreateUser(userManager, "bob@cayeshni.com", "Bob Smith");
        var charlie = await CreateUser(userManager, "charlie@cayeshni.com", "Charlie Brown");
        var diana = await CreateUser(userManager, "diana@cayeshni.com", "Diana Prince");

        // ── FRIENDSHIPS ─────────────────────────
        await SeedFriendships(db, alice, bob, charlie, diana);

        // ── GROUP: Trip to Cairo ─────────────────
        await SeedTripGroup(db, alice, bob, charlie);

        // ── GROUP: House Expenses ────────────────
        await SeedHouseExpensesGroup(db, alice, diana, bob);
    }

    private static async Task<AppUser> CreateUser(
        UserManager<AppUser> userManager,
        string email,
        string name)
    {
        var user = await userManager.FindByEmailAsync(email);

        if (user != null) return user;

        user = new AppUser
        {
            UserName = email,
            Email = email,
            Name = name
        };

        await userManager.CreateAsync(user, "Password123!");

        return user;
    }

    private static async Task SeedFriendships(AppDbContext db, AppUser alice, AppUser bob, AppUser charlie, AppUser diana)
    {
        if (!await db.Set<Friendship>().AnyAsync())
        {
            db.Set<Friendship>().AddRange(
                new Friendship
                {
                    UserIdA = alice.Id,
                    UserIdB = bob.Id,
                    Status = FriendshipStatus.Friends,
                    CreatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Friendship
                {
                    UserIdA = alice.Id,
                    UserIdB = charlie.Id,
                    Status = FriendshipStatus.Friends,
                    CreatedAt = DateTime.UtcNow.AddDays(-20)
                },
                new Friendship
                {
                    UserIdA = bob.Id,
                    UserIdB = charlie.Id,
                    Status = FriendshipStatus.Friends,
                    CreatedAt = DateTime.UtcNow.AddDays(-15)
                },
                new Friendship
                {
                    UserIdA = alice.Id,
                    UserIdB = diana.Id,
                    Status = FriendshipStatus.Friends,
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                }
            );

            await db.SaveChangesAsync();
        }
    }

    private static async Task SeedTripGroup(AppDbContext db, AppUser alice, AppUser bob, AppUser charlie)
    {
        if (await db.Groups.FirstOrDefaultAsync(g => g.Name == "Trip to Cairo") == null)
        {
            var group = new Group
            {
                Name = "Trip to Cairo",
                CreatedById = alice.Id,
                DefaultCurrency = Currency.USD
            };

            db.Groups.Add(group);
            await db.SaveChangesAsync();

            // ── MEMBERS ──────────────────────────
            db.GroupMembers.AddRange(
                new GroupMember { GroupId = group.Id, UserId = alice.Id, JoinedAt = DateTime.UtcNow },
                new GroupMember { GroupId = group.Id, UserId = bob.Id, JoinedAt = DateTime.UtcNow.AddMinutes(5) },
                new GroupMember { GroupId = group.Id, UserId = charlie.Id, JoinedAt = DateTime.UtcNow.AddMinutes(10) }
            );

            await db.SaveChangesAsync();

            // ── TRANSACTION 1: Hotel ────────────
            var hotelTx = new Transaction
            {
                GroupId = group.Id,
                PaidByUserId = alice.Id,
                TotalAmount = 900,
                Currency = Currency.USD,
                Category = TransactionCategory.Accommodation,
                Description = "Hotel for 3 nights"
            };

            db.Transactions.Add(hotelTx);
            await db.SaveChangesAsync();

            db.TransactionMembers.AddRange(
                new TransactionMember { TransactionId = hotelTx.Id, UserId = alice.Id, AmountOwed = 300 },
                new TransactionMember { TransactionId = hotelTx.Id, UserId = bob.Id, AmountOwed = 300 },
                new TransactionMember { TransactionId = hotelTx.Id, UserId = charlie.Id, AmountOwed = 300 }
            );

            await db.SaveChangesAsync();

            // ── TRANSACTION 2: Food ─────────────
            var foodTx = new Transaction
            {
                GroupId = group.Id,
                PaidByUserId = bob.Id,
                TotalAmount = 450,
                Currency = Currency.USD,
                Category = TransactionCategory.Food,
                Description = "Meals and dining"
            };

            db.Transactions.Add(foodTx);
            await db.SaveChangesAsync();

            db.TransactionMembers.AddRange(
                new TransactionMember { TransactionId = foodTx.Id, UserId = alice.Id, AmountOwed = 150 },
                new TransactionMember { TransactionId = foodTx.Id, UserId = bob.Id, AmountOwed = 150 },
                new TransactionMember { TransactionId = foodTx.Id, UserId = charlie.Id, AmountOwed = 150 }
            );

            await db.SaveChangesAsync();

            // ── TRANSACTION 3: Activities ───────
            var activitiesTx = new Transaction
            {
                GroupId = group.Id,
                PaidByUserId = charlie.Id,
                TotalAmount = 300,
                Currency = Currency.USD,
                Category = TransactionCategory.Entertainment,
                Description = "Pyramid tours and activities"
            };

            db.Transactions.Add(activitiesTx);
            await db.SaveChangesAsync();

            db.TransactionMembers.AddRange(
                new TransactionMember { TransactionId = activitiesTx.Id, UserId = alice.Id, AmountOwed = 100 },
                new TransactionMember { TransactionId = activitiesTx.Id, UserId = bob.Id, AmountOwed = 100 },
                new TransactionMember { TransactionId = activitiesTx.Id, UserId = charlie.Id, AmountOwed = 100 }
            );

            await db.SaveChangesAsync();

            // ── SETTLEMENTS ─────────────────────
            // Alice settled with Bob
            var settlement1 = new Settlement
            {
                GroupId = group.Id,
                PayerUserId = alice.Id,
                PayeeUserId = bob.Id,
                Amount = 100,
                Currency = Currency.USD,
                note = "Payment for food expenses"
            };

            db.Settlements.Add(settlement1);
            await db.SaveChangesAsync();

            // ── NOTIFICATIONS ───────────────────
            db.Set<Notification>().AddRange(
                new Notification
                {
                    Type = NotificationType.TransactionCreated,
                    RecipientId = bob.Id,
                    SenderId = alice.Id,
                    GroupId = group.Id,
                    TransactionId = hotelTx.Id,
                    Text = "Alice added a transaction: Hotel for 3 nights ($900)"
                },
                new Notification
                {
                    Type = NotificationType.PaymentReceived,
                    RecipientId = bob.Id,
                    SenderId = alice.Id,
                    GroupId = group.Id,
                    Text = "Alice paid you $100 for shared expenses"
                }
            );

            await db.SaveChangesAsync();
        }
    }

    private static async Task SeedHouseExpensesGroup(AppDbContext db, AppUser alice, AppUser diana, AppUser bob)
    {
        if (await db.Groups.FirstOrDefaultAsync(g => g.Name == "House Expenses") == null)
        {
            var group = new Group
            {
                Name = "House Expenses",
                CreatedById = alice.Id,
                DefaultCurrency = Currency.USD
            };

            db.Groups.Add(group);
            await db.SaveChangesAsync();

            // ── MEMBERS ──────────────────────────
            db.GroupMembers.AddRange(
                new GroupMember { GroupId = group.Id, UserId = alice.Id, JoinedAt = DateTime.UtcNow },
                new GroupMember { GroupId = group.Id, UserId = diana.Id, JoinedAt = DateTime.UtcNow.AddMinutes(2) },
                new GroupMember { GroupId = group.Id, UserId = bob.Id, JoinedAt = DateTime.UtcNow.AddMinutes(5) }
            );

            await db.SaveChangesAsync();

            // ── TRANSACTION 1: Rent ─────────────
            var rentTx = new Transaction
            {
                GroupId = group.Id,
                PaidByUserId = alice.Id,
                TotalAmount = 3000,
                Currency = Currency.USD,
                Category = TransactionCategory.Accommodation,
                Description = "Monthly rent"
            };

            db.Transactions.Add(rentTx);
            await db.SaveChangesAsync();

            db.TransactionMembers.AddRange(
                new TransactionMember { TransactionId = rentTx.Id, UserId = alice.Id, AmountOwed = 1000 },
                new TransactionMember { TransactionId = rentTx.Id, UserId = diana.Id, AmountOwed = 1000 },
                new TransactionMember { TransactionId = rentTx.Id, UserId = bob.Id, AmountOwed = 1000 }
            );

            await db.SaveChangesAsync();

            // ── TRANSACTION 2: Groceries ────────
            var groceriesTx = new Transaction
            {
                GroupId = group.Id,
                PaidByUserId = diana.Id,
                TotalAmount = 200,
                Currency = Currency.USD,
                Category = TransactionCategory.Food,
                Description = "Weekly groceries"
            };

            db.Transactions.Add(groceriesTx);
            await db.SaveChangesAsync();

            db.TransactionMembers.AddRange(
                new TransactionMember { TransactionId = groceriesTx.Id, UserId = alice.Id, AmountOwed = 75 },
                new TransactionMember { TransactionId = groceriesTx.Id, UserId = diana.Id, AmountOwed = 70 },
                new TransactionMember { TransactionId = groceriesTx.Id, UserId = bob.Id, AmountOwed = 55 }
            );

            await db.SaveChangesAsync();

            // ── SETTLEMENT ───────────────────────
            var settlement = new Settlement
            {
                GroupId = group.Id,
                PayerUserId = diana.Id,
                PayeeUserId = alice.Id,
                Amount = 500,
                Currency = Currency.USD,
                note = "Partial payment for rent"
            };

            db.Settlements.Add(settlement);
            await db.SaveChangesAsync();
        }
    }
}
