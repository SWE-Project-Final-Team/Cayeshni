using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Application.Features.Users.Friends;
using Cayeshni.API.Domain.Entities;
using Cayeshni.API.Domain.Enums;
using Cayeshni.API.Infrastructure.Identity;
using Cayeshni.API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Cayeshni.Tests.Users;

public class FriendServiceTests
{
    private readonly FakeAppDbContext _db = new();
    private readonly FakeEmailNormalizer _emailNormalizer = new();
    private readonly FakeFileStorageService _fileStorage = new();

    private FriendService CreateService()
        => new FriendService(_db, _emailNormalizer, _fileStorage);

    #region SendRequestAsync Tests

    [Fact]
    public async Task SendRequestAsync_WithValidEmail_CreatesAndSavesFriendship()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var targetEmail = "receiver@example.com";

        _db.Users.Add(new AppUser
        {
            Id = senderId,
            Email = "sender@example.com",
            NormalizedEmail = _emailNormalizer.NormalizeEmail("sender@example.com")!,
            UserName = "sender",
            NormalizedUserName = "sender",
            Name = "Sender",
            PreferredCurrency = Currency.USD
        });

        _db.Users.Add(new AppUser
        {
            Id = receiverId,
            Email = targetEmail,
            NormalizedEmail = _emailNormalizer.NormalizeEmail(targetEmail)!,
            UserName = "receiver",
            NormalizedUserName = "receiver",
            Name = "Receiver",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act
        await service.SendRequestAsync(senderId, new SendFriendRequestDto(null, targetEmail));

        // Assert
        var friendship = _db.Friendships.FirstOrDefault();
        Assert.NotNull(friendship);
        Assert.Equal(FriendshipStatus.Pending, friendship!.Status);
        Assert.Equal(senderId, friendship.SenderId);
        Assert.True(
            (friendship.UserIdA == senderId && friendship.UserIdB == receiverId) ||
            (friendship.UserIdA == receiverId && friendship.UserIdB == senderId)
        );
    }

    [Fact]
    public async Task SendRequestAsync_WithValidUserId_CreatesAndSavesFriendship()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();

        _db.Users.Add(new AppUser
        {
            Id = senderId,
            Email = "sender@example.com",
            NormalizedEmail = "sender@example.com",
            UserName = "sender",
            NormalizedUserName = "sender",
            Name = "Sender",
            PreferredCurrency = Currency.USD
        });

        _db.Users.Add(new AppUser
        {
            Id = receiverId,
            Email = "receiver@example.com",
            NormalizedEmail = "receiver@example.com",
            UserName = "receiver",
            NormalizedUserName = "receiver",
            Name = "Receiver",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act
        await service.SendRequestAsync(senderId, new SendFriendRequestDto(receiverId, null));

        // Assert
        var friendship = _db.Friendships.FirstOrDefault();
        Assert.NotNull(friendship);
        Assert.Equal(FriendshipStatus.Pending, friendship!.Status);
        Assert.Equal(senderId, friendship.SenderId);
    }

    [Fact]
    public async Task SendRequestAsync_WithBothEmailAndUserId_ThrowsValidationException()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();

        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => service.SendRequestAsync(senderId, new SendFriendRequestDto(receiverId, "user@example.com"))
        );

        Assert.Equal("Provide either target email or target user id, not both.", ex.Message);
    }

    [Fact]
    public async Task SendRequestAsync_WithNeitherEmailNorUserId_ThrowsValidationException()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => service.SendRequestAsync(senderId, new SendFriendRequestDto(null, null))
        );

        Assert.Equal("Provide the friend's email or user id.", ex.Message);
    }

    [Fact]
    public async Task SendRequestAsync_WithInvalidEmail_ThrowsValidationException()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        _emailNormalizer.InvalidEmail = "invalid-email";

        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => service.SendRequestAsync(senderId, new SendFriendRequestDto(null, "invalid-email"))
        );

        Assert.Equal("Invalid email address.", ex.Message);
    }

    [Fact]
    public async Task SendRequestAsync_WithNonExistentEmail_ThrowsNotFoundException()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var targetEmail = "nonexistent@example.com";

        _db.Users.Add(new AppUser
        {
            Id = senderId,
            Email = "sender@example.com",
            NormalizedEmail = "sender@example.com",
            UserName = "sender",
            NormalizedUserName = "sender",
            Name = "Sender",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => service.SendRequestAsync(senderId, new SendFriendRequestDto(null, targetEmail))
        );
    }

    [Fact]
    public async Task SendRequestAsync_WithNonExistentUserId_ThrowsNotFoundException()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var nonExistentUserId = Guid.NewGuid();

        _db.Users.Add(new AppUser
        {
            Id = senderId,
            Email = "sender@example.com",
            NormalizedEmail = "sender@example.com",
            UserName = "sender",
            NormalizedUserName = "sender",
            Name = "Sender",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => service.SendRequestAsync(senderId, new SendFriendRequestDto(nonExistentUserId, null))
        );
    }

    [Fact]
    public async Task SendRequestAsync_SenderEqualsReceiver_ThrowsValidationException()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _db.Users.Add(new AppUser
        {
            Id = userId,
            Email = "user@example.com",
            NormalizedEmail = "user@example.com",
            UserName = "user",
            NormalizedUserName = "user",
            Name = "User",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => service.SendRequestAsync(userId, new SendFriendRequestDto(userId, null))
        );

        Assert.Equal("Cannot add yourself.", ex.Message);
    }

    [Fact]
    public async Task SendRequestAsync_FriendshipAlreadyExists_ThrowsValidationException()
    {
        // Arrange
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        _db.Users.Add(new AppUser
        {
            Id = userA,
            Email = "userA@example.com",
            NormalizedEmail = "userA@example.com",
            UserName = "userA",
            NormalizedUserName = "usera",
            Name = "User A",
            PreferredCurrency = Currency.USD
        });

        _db.Users.Add(new AppUser
        {
            Id = userB,
            Email = "userB@example.com",
            NormalizedEmail = "userB@example.com",
            UserName = "userB",
            NormalizedUserName = "userb",
            Name = "User B",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        // Create existing friendship
        var orderedA = userA.CompareTo(userB) < 0 ? userA : userB;
        var orderedB = userA.CompareTo(userB) < 0 ? userB : userA;

        _db.Friendships.Add(new Friendship
        {
            UserIdA = orderedA,
            UserIdB = orderedB,
            SenderId = userA,
            Status = FriendshipStatus.Pending
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ValidationException>(
            () => service.SendRequestAsync(userA, new SendFriendRequestDto(userB, null))
        );

        Assert.Equal("Friendship already exists.", ex.Message);
    }

    [Fact]
    public async Task SendRequestAsync_EmailIsTrimmed()
    {
        // Arrange
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var targetEmail = "receiver@example.com";

        _db.Users.Add(new AppUser
        {
            Id = senderId,
            Email = "sender@example.com",
            NormalizedEmail = "sender@example.com",
            UserName = "sender",
            NormalizedUserName = "sender",
            Name = "Sender",
            PreferredCurrency = Currency.USD
        });

        _db.Users.Add(new AppUser
        {
            Id = receiverId,
            Email = targetEmail,
            NormalizedEmail = _emailNormalizer.NormalizeEmail(targetEmail)!,
            UserName = "receiver",
            NormalizedUserName = "receiver",
            Name = "Receiver",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act - Send with email surrounded by whitespace
        await service.SendRequestAsync(senderId, new SendFriendRequestDto(null, "  receiver@example.com  "));

        // Assert
        var friendship = _db.Friendships.FirstOrDefault();
        Assert.NotNull(friendship);
        Assert.Equal(FriendshipStatus.Pending, friendship!.Status);
        Assert.Equal(senderId, friendship.SenderId);
        Assert.True(
            (friendship.UserIdA == senderId && friendship.UserIdB == receiverId) ||
            (friendship.UserIdA == receiverId && friendship.UserIdB == senderId)
        );
    }

    #endregion

    #region AcceptRequestAsync Tests

    [Fact]
    public async Task AcceptRequestAsync_WithValidRequest_UpdatesStatusToFriends()
    {
        // Arrange
        var requester = Guid.NewGuid();
        var currentUser = Guid.NewGuid();

        var userA = requester.CompareTo(currentUser) < 0 ? requester : currentUser;
        var userB = requester.CompareTo(currentUser) < 0 ? currentUser : requester;

        var friendship = new Friendship
        {
            UserIdA = userA,
            UserIdB = userB,
            SenderId = requester,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _db.Friendships.Add(friendship);

        var service = CreateService();

        // Act
        await service.AcceptRequestAsync(currentUser, requester);

        // Assert
        Assert.Equal(FriendshipStatus.Friends, friendship.Status);
        Assert.NotNull(friendship.UpdatedAt);
    }

    [Fact]
    public async Task AcceptRequestAsync_FriendshipNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var requester = Guid.NewGuid();
        var currentUser = Guid.NewGuid();

        var service = CreateService();

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => service.AcceptRequestAsync(currentUser, requester)
        );
    }

    #endregion

    #region RemoveFriendAsync Tests

    [Fact]
    public async Task RemoveFriendAsync_WithExistingFriendship_RemovesFriendship()
    {
        // Arrange
        var currentUser = Guid.NewGuid();
        var otherUser = Guid.NewGuid();

        var userA = currentUser.CompareTo(otherUser) < 0 ? currentUser : otherUser;
        var userB = currentUser.CompareTo(otherUser) < 0 ? otherUser : currentUser;

        var friendship = new Friendship
        {
            UserIdA = userA,
            UserIdB = userB,
            SenderId = currentUser,
            Status = FriendshipStatus.Friends
        };

        _db.Friendships.Add(friendship);
        var service = CreateService();

        // Act
        await service.RemoveFriendAsync(currentUser, otherUser);

        // Assert
        Assert.Empty(_db.Friendships);
    }

    [Fact]
    public async Task RemoveFriendAsync_FriendshipNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var currentUser = Guid.NewGuid();
        var otherUser = Guid.NewGuid();

        var service = CreateService();

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(
            () => service.RemoveFriendAsync(currentUser, otherUser)
        );
    }

    #endregion

    #region GetPendingRequestsAsync Tests

    [Fact]
    public async Task GetPendingRequestsAsync_ReturnsPendingRequestsWhereUserIsReceiver()
    {
        // Arrange
        var currentUser = Guid.NewGuid();
        var requester1 = Guid.NewGuid();
        var requester2 = Guid.NewGuid();

        // Add users
        _db.Users.Add(new AppUser
        {
            Id = currentUser,
            Email = "current@example.com",
            NormalizedEmail = "current@example.com",
            UserName = "current",
            NormalizedUserName = "current",
            Name = "Current User",
            PreferredCurrency = Currency.USD
        });

        _db.Users.Add(new AppUser
        {
            Id = requester1,
            Email = "requester1@example.com",
            NormalizedEmail = "requester1@example.com",
            UserName = "requester1",
            NormalizedUserName = "requester1",
            Name = "Requester 1",
            PreferredCurrency = Currency.USD,
            ProfilePicturePath = "profiles/requester1.png"
        });

        _db.Users.Add(new AppUser
        {
            Id = requester2,
            Email = "requester2@example.com",
            NormalizedEmail = "requester2@example.com",
            UserName = "requester2",
            NormalizedUserName = "requester2",
            Name = "Requester 2",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        // Add pending requests
        var userA1 = requester1.CompareTo(currentUser) < 0 ? requester1 : currentUser;
        var userB1 = requester1.CompareTo(currentUser) < 0 ? currentUser : requester1;

        var userA2 = requester2.CompareTo(currentUser) < 0 ? requester2 : currentUser;
        var userB2 = requester2.CompareTo(currentUser) < 0 ? currentUser : requester2;

        _db.Friendships.Add(new Friendship
        {
            UserIdA = userA1,
            UserIdB = userB1,
            SenderId = requester1,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });

        _db.Friendships.Add(new Friendship
        {
            UserIdA = userA2,
            UserIdB = userB2,
            SenderId = requester2,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        });

        await _db.SaveChangesAsync();

        _fileStorage.MarkExists("profiles/requester1.png");

        var service = CreateService();

        // Act
        var pending = await service.GetPendingRequestsAsync(currentUser);

        // Assert
        Assert.Equal(2, pending.Count);
        Assert.Contains(pending, p => p.UserId == requester1);
        Assert.Contains(pending, p => p.UserId == requester2);
        
        var requester1Pending = pending.First(p => p.UserId == requester1);
        Assert.Equal("Requester 1", requester1Pending.Name);
        Assert.Equal("requester1@example.com", requester1Pending.Email);
        Assert.NotNull(requester1Pending.ProfilePictureUrl);
    }

    [Fact]
    public async Task GetPendingRequestsAsync_WithNoPendingRequests_ReturnsEmptyList()
    {
        // Arrange
        var currentUser = Guid.NewGuid();

        _db.Users.Add(new AppUser
        {
            Id = currentUser,
            Email = "current@example.com",
            NormalizedEmail = "current@example.com",
            UserName = "current",
            NormalizedUserName = "current",
            Name = "Current User",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act
        var pending = await service.GetPendingRequestsAsync(currentUser);

        // Assert
        Assert.Empty(pending);
    }

    [Fact]
    public async Task GetPendingRequestsAsync_ProfilePictureUrlIsNull_WhenNoProfilePicture()
    {
        // Arrange
        var currentUser = Guid.NewGuid();
        var requester = Guid.NewGuid();

        _db.Users.Add(new AppUser
        {
            Id = currentUser,
            Email = "current@example.com",
            NormalizedEmail = "current@example.com",
            UserName = "current",
            NormalizedUserName = "current",
            Name = "Current User",
            PreferredCurrency = Currency.USD
        });

        _db.Users.Add(new AppUser
        {
            Id = requester,
            Email = "requester@example.com",
            NormalizedEmail = "requester@example.com",
            UserName = "requester",
            NormalizedUserName = "requester",
            Name = "Requester",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var userA = requester.CompareTo(currentUser) < 0 ? requester : currentUser;
        var userB = requester.CompareTo(currentUser) < 0 ? currentUser : requester;

        _db.Friendships.Add(new Friendship
        {
            UserIdA = userA,
            UserIdB = userB,
            SenderId = requester,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act
        var pending = await service.GetPendingRequestsAsync(currentUser);

        // Assert
        Assert.Single(pending);
        Assert.Null(pending[0].ProfilePictureUrl);
    }

    #endregion

    #region GetFriendsAsync Tests

    [Fact]
    public async Task GetFriendsAsync_ReturnsFriendsList()
    {
        // Arrange
        var currentUser = Guid.NewGuid();
        var friend1 = Guid.NewGuid();
        var friend2 = Guid.NewGuid();

        _db.Users.Add(new AppUser
        {
            Id = currentUser,
            Email = "current@example.com",
            NormalizedEmail = "current@example.com",
            UserName = "current",
            NormalizedUserName = "current",
            Name = "Current User",
            PreferredCurrency = Currency.USD
        });

        _db.Users.Add(new AppUser
        {
            Id = friend1,
            Email = "friend1@example.com",
            NormalizedEmail = "friend1@example.com",
            UserName = "friend1",
            NormalizedUserName = "friend1",
            Name = "Friend 1",
            PreferredCurrency = Currency.USD,
            ProfilePicturePath = "profiles/friend1.png"
        });

        _db.Users.Add(new AppUser
        {
            Id = friend2,
            Email = "friend2@example.com",
            NormalizedEmail = "friend2@example.com",
            UserName = "friend2",
            NormalizedUserName = "friend2",
            Name = "Friend 2",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var userA1 = friend1.CompareTo(currentUser) < 0 ? friend1 : currentUser;
        var userB1 = friend1.CompareTo(currentUser) < 0 ? currentUser : friend1;

        var userA2 = friend2.CompareTo(currentUser) < 0 ? friend2 : currentUser;
        var userB2 = friend2.CompareTo(currentUser) < 0 ? currentUser : friend2;

        _db.Friendships.Add(new Friendship
        {
            UserIdA = userA1,
            UserIdB = userB1,
            SenderId = friend1,
            Status = FriendshipStatus.Friends
        });

        _db.Friendships.Add(new Friendship
        {
            UserIdA = userA2,
            UserIdB = userB2,
            SenderId = friend2,
            Status = FriendshipStatus.Friends
        });

        // Add a pending friendship (should not be included)
        var pendingSenderId = Guid.NewGuid();
        _db.Users.Add(new AppUser
        {
            Id = pendingSenderId,
            Email = "pending@example.com",
            NormalizedEmail = "pending@example.com",
            UserName = "pending",
            NormalizedUserName = "pending",
            Name = "Pending",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var userAPending = pendingSenderId.CompareTo(currentUser) < 0 ? pendingSenderId : currentUser;
        var userBPending = pendingSenderId.CompareTo(currentUser) < 0 ? currentUser : pendingSenderId;

        _db.Friendships.Add(new Friendship
        {
            UserIdA = userAPending,
            UserIdB = userBPending,
            SenderId = pendingSenderId,
            Status = FriendshipStatus.Pending
        });

        await _db.SaveChangesAsync();

        _fileStorage.MarkExists("profiles/friend1.png");

        var service = CreateService();

        // Act
        var friends = await service.GetFriendsAsync(currentUser);

        // Assert
        Assert.Equal(2, friends.Count);
        Assert.Contains(friends, f => f.UserId == friend1);
        Assert.Contains(friends, f => f.UserId == friend2);
        Assert.Equal("Friend 1", friends.First(f => f.UserId == friend1).Name);
        Assert.NotNull(friends.First(f => f.UserId == friend1).ProfilePictureUrl);
    }

    [Fact]
    public async Task GetFriendsAsync_WithNoFriends_ReturnsEmptyList()
    {
        // Arrange
        var currentUser = Guid.NewGuid();

        _db.Users.Add(new AppUser
        {
            Id = currentUser,
            Email = "current@example.com",
            NormalizedEmail = "current@example.com",
            UserName = "current",
            NormalizedUserName = "current",
            Name = "Current User",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act
        var friends = await service.GetFriendsAsync(currentUser);

        // Assert
        Assert.Empty(friends);
    }

    [Fact]
    public async Task GetFriendsAsync_ProfilePictureUrlIsNull_WhenNoProfilePicture()
    {
        // Arrange
        var currentUser = Guid.NewGuid();
        var friend = Guid.NewGuid();

        _db.Users.Add(new AppUser
        {
            Id = currentUser,
            Email = "current@example.com",
            NormalizedEmail = "current@example.com",
            UserName = "current",
            NormalizedUserName = "current",
            Name = "Current User",
            PreferredCurrency = Currency.USD
        });

        _db.Users.Add(new AppUser
        {
            Id = friend,
            Email = "friend@example.com",
            NormalizedEmail = "friend@example.com",
            UserName = "friend",
            NormalizedUserName = "friend",
            Name = "Friend",
            PreferredCurrency = Currency.USD
        });

        await _db.SaveChangesAsync();

        var userA = friend.CompareTo(currentUser) < 0 ? friend : currentUser;
        var userB = friend.CompareTo(currentUser) < 0 ? currentUser : friend;

        _db.Friendships.Add(new Friendship
        {
            UserIdA = userA,
            UserIdB = userB,
            SenderId = friend,
            Status = FriendshipStatus.Friends
        });

        await _db.SaveChangesAsync();

        var service = CreateService();

        // Act
        var friends = await service.GetFriendsAsync(currentUser);

        // Assert
        Assert.Single(friends);
        Assert.Null(friends[0].ProfilePictureUrl);
    }

    #endregion

    #region Test Helpers

    private sealed class FakeAppDbContext : AppDbContext
    {
        public FakeAppDbContext() : base(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options)
        {
        }

        public new DbSet<Friendship> Friendships => Set<Friendship>();
        public new DbSet<AppUser> Users => Set<AppUser>();
    }

    private sealed class FakeEmailNormalizer : ILookupNormalizer
    {
        public string? InvalidEmail { get; set; }

        public string? Normalize(string? key)
        {
            if (string.IsNullOrEmpty(key))
                return null;

            if (key == InvalidEmail)
                return null;

            return key.ToUpperInvariant();
        }

        public string? NormalizeName(string? name)
        {
            if (string.IsNullOrEmpty(name))
                return null;

            return name.ToUpperInvariant();
        }

        public string? NormalizeEmail(string? email)
        {
            if (string.IsNullOrEmpty(email))
                return null;

            if (email == InvalidEmail)
                return null;

            return email.ToUpperInvariant();
        }
    }

    private sealed class FakeFileStorageService : IFileStorageService
    {
        private readonly string _baseUrl;
        private readonly HashSet<string> _existing = new(StringComparer.OrdinalIgnoreCase);
        private int _counter;

        public FakeFileStorageService(string baseUrl = "https://cdn.example.com/uploads")
        {
            _baseUrl = baseUrl.TrimEnd('/');
        }

        public List<(string FileName, string ContentType, FileFolder Folder)> SaveCalls { get; } = [];
        public List<string> DeletedPaths { get; } = [];

        public void MarkExists(string relativePath) => _existing.Add(Normalize(relativePath));

        public Task<string> SaveAsync(Stream fileStream, string fileName, string contentType, FileFolder folder)
        {
            var relativePath = $"{folder.ToString().ToLowerInvariant()}/generated-{++_counter}{Path.GetExtension(fileName)}";
            relativePath = Normalize(relativePath);
            SaveCalls.Add((fileName, contentType, folder));
            _existing.Add(relativePath);
            return Task.FromResult(relativePath);
        }

        public Task DeleteAsync(string relativePath)
        {
            relativePath = Normalize(relativePath);
            DeletedPaths.Add(relativePath);
            _existing.Remove(relativePath);
            return Task.CompletedTask;
        }

        public string GetBaseUrl() => _baseUrl;

        public string? GetUrl(string? profilePicturePath)
        {
            if (string.IsNullOrWhiteSpace(profilePicturePath))
            {
                return null;
            }

            var normalized = Normalize(profilePicturePath);
            return _existing.Contains(normalized) ? $"{_baseUrl}/{normalized}" : null;
        }

        private static string Normalize(string path) => path.Replace('\\', '/').TrimStart('/');
    }

    #endregion
}
