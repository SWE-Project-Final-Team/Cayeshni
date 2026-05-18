using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Cayeshni.Application.Common.Exceptions;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Users;
using Cayeshni.Domain.Entities;
using Cayeshni.Domain.Enums;
using Xunit;

namespace Cayeshni.Tests.Users;

public class UserServiceTests
{
    [Fact]
    public async Task GetProfileAsync_ReturnsUrlMappedFromRelativePath()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "user@test.com",
            Name = "User",
            ProfilePicturePath = "profiles/avatar.png",
            PreferredCurrency = Currency.USD,
            CreatedAt = new DateTime(2026, 5, 10, 12, 0, 0, DateTimeKind.Utc)
        };

        var repo = new FakeUserRepository(user) { PicturePath = user.ProfilePicturePath };
        var storage = new FakeFileStorageService("https://cdn.example.com/uploads");
        storage.MarkExists("profiles/avatar.png");

        var service = new UserService(repo, storage, new FakeProfileImageProcessor());

        var profile = await service.GetProfileAsync(userId);

        Assert.Equal(userId, profile.Id);
        Assert.Equal("User", profile.Name);
        Assert.Equal("user@test.com", profile.Email);
        Assert.Equal(Currency.USD, profile.PreferredCurrency);
        Assert.Equal("https://cdn.example.com/uploads/profiles/avatar.png", profile.ProfilePictureUrl);
    }

    [Fact]
    public async Task UpdateProfileAsync_TrimsName_AndUpdatesRepository()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "user@test.com", Name = "Old", PreferredCurrency = Currency.EGP, CreatedAt = DateTime.UtcNow };
        var repo = new FakeUserRepository(user);
        var storage = new FakeFileStorageService();
        var service = new UserService(repo, storage, new FakeProfileImageProcessor());

        await service.UpdateProfileAsync(userId, new UpdateProfileDto("  New Name  ", Currency.USD));

        Assert.Equal("New Name", repo.LastUpdatedName);
        Assert.Equal(Currency.USD, repo.LastUpdatedCurrency);
        Assert.Equal("New Name", user.Name);
        Assert.Equal(Currency.USD, user.PreferredCurrency);
    }

    [Fact]
    public async Task UpdateProfileAsync_InvalidName_ThrowsValidationException()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "user@test.com", Name = "Old", PreferredCurrency = Currency.EGP, CreatedAt = DateTime.UtcNow };
        var repo = new FakeUserRepository(user);
        var storage = new FakeFileStorageService();
        var service = new UserService(repo, storage, new FakeProfileImageProcessor());

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdateProfileAsync(userId, new UpdateProfileDto("  ", Currency.USD)));
    }

    [Fact]
    public async Task UploadPictureAsync_SavesInProfilesFolder_DeletesOldPicture_AndUpdatesPath()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "user@test.com",
            Name = "User",
            ProfilePicturePath = "profiles/old.png",
            PreferredCurrency = Currency.USD,
            CreatedAt = DateTime.UtcNow
        };

        var repo = new FakeUserRepository(user) { PicturePath = "profiles/old.png" };
        var storage = new FakeFileStorageService("https://cdn.example.com/uploads");
        storage.MarkExists("profiles/old.png");

        var service = new UserService(repo, storage, new FakeProfileImageProcessor());
        await using var stream = new MemoryStream(new byte[] { 1, 2, 3, 4 });

        var response = await service.UploadPictureAsync(userId, stream, "avatar.png", "image/png");

        Assert.Single(storage.SaveCalls);
        Assert.Equal(FileFolder.Profiles, storage.SaveCalls[0].Folder);
        Assert.Equal("profiles/old.png", storage.DeletedPaths.Single());
        Assert.StartsWith("https://cdn.example.com/uploads/profiles/", response.PictureUrl);
        Assert.NotNull(repo.LastUpdatedPicturePath);
        Assert.StartsWith("profiles/", repo.LastUpdatedPicturePath!);
        Assert.False(string.IsNullOrWhiteSpace(user.ProfilePicturePath));
    }

    [Fact]
    public async Task DeletePictureAsync_DeletesOldPicture_AndClearsPath()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "user@test.com",
            Name = "User",
            ProfilePicturePath = "profiles/old.png",
            PreferredCurrency = Currency.USD,
            CreatedAt = DateTime.UtcNow
        };

        var repo = new FakeUserRepository(user) { PicturePath = "profiles/old.png" };
        var storage = new FakeFileStorageService();
        storage.MarkExists("profiles/old.png");

        var service = new UserService(repo, storage, new FakeProfileImageProcessor());

        await service.DeletePictureAsync(userId);

        Assert.Equal("profiles/old.png", storage.DeletedPaths.Single());
        Assert.Null(repo.LastUpdatedPicturePath);
        Assert.Null(user.ProfilePicturePath);
    }

    [Fact]
    public async Task DeletePictureAsync_WhenNoPicture_DoesNothing()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "user@test.com",
            Name = "User",
            PreferredCurrency = Currency.USD,
            CreatedAt = DateTime.UtcNow
        };

        var repo = new FakeUserRepository(user);
        var storage = new FakeFileStorageService();
        var service = new UserService(repo, storage, new FakeProfileImageProcessor());

        await service.DeletePictureAsync(userId);

        Assert.Empty(storage.DeletedPaths);
        Assert.Null(repo.LastUpdatedPicturePath);
    }

    private sealed class FakeUserRepository : IUserRepository
    {
        private readonly User _user;

        public FakeUserRepository(User user)
        {
            _user = user;
        }

        public string? PicturePath { get; set; }
        public string? LastUpdatedName { get; private set; }
        public Currency? LastUpdatedCurrency { get; private set; }
        public string? LastUpdatedPicturePath { get; private set; }

        public Task<User?> GetByIdAsync(Guid userId)
            => Task.FromResult(_user.Id == userId ? _user : null);

        public Task<string?> GetPicturePathAsync(Guid userId)
            => Task.FromResult(_user.Id == userId ? (PicturePath ?? _user.ProfilePicturePath) : null);

        public Task UpdateProfileAsync(Guid userId, string name, Currency currency)
        {
            if (_user.Id == userId)
            {
                LastUpdatedName = name;
                LastUpdatedCurrency = currency;
                _user.Name = name;
                _user.PreferredCurrency = currency;
            }

            return Task.CompletedTask;
        }

        public Task UpdatePictureAsync(Guid userId, string? picturePath)
        {
            if (_user.Id == userId)
            {
                LastUpdatedPicturePath = picturePath;
                PicturePath = picturePath;
                _user.ProfilePicturePath = picturePath;
            }

            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<User>> SearchByDisplayNameAsync(string query, Guid excludeUserId, int take)
        {
            // For testing purposes, return empty list
            return Task.FromResult<IReadOnlyList<User>>(new List<User>());
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
            profilePicturePath = string.IsNullOrWhiteSpace(profilePicturePath)
                ? Path.Combine("profiles", "avatar.png")
                : profilePicturePath;

            var normalized = Normalize(profilePicturePath);
            return _existing.Contains(normalized) ? $"{_baseUrl}/{normalized}" : null!;
        }

        private static string Normalize(string path) => path.Replace('\\', '/').TrimStart('/');
    }

    private sealed class FakeProfileImageProcessor : IProfileImageProcessor
    {
        public async Task<Stream> ProcessAsync(Stream stream)
        {
            var output = new MemoryStream();
            await stream.CopyToAsync(output);
            output.Position = 0;
            return output;
        }
    }
}


