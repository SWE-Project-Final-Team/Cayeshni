using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cayeshni.API.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class IndexAspNetUsersEmailConfirmedCreatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_EmailConfirmed_CreatedAt",
                table: "AspNetUsers",
                columns: new[] { "EmailConfirmed", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_EmailConfirmed_CreatedAt",
                table: "AspNetUsers");
        }
    }
}
