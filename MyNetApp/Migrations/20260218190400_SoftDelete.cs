using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNetApp.Migrations
{
    /// <inheritdoc />
    public partial class SoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Statuses",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Statuses",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Messages",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Messages",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Statuses");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Statuses");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Messages");
        }
    }
}
