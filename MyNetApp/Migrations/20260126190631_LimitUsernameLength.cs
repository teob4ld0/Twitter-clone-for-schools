using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNetApp.Migrations
{
    /// <inheritdoc />
    public partial class LimitUsernameLength : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Primero truncar los usernames que excedan 14 caracteres
            migrationBuilder.Sql(
                @"UPDATE Users 
                  SET Username = SUBSTRING(Username, 1, 14)
                  WHERE LENGTH(Username) > 14;");

            // Luego aplicar la restricción de longitud
            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Users",
                type: "varchar(14)",
                maxLength: 14,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Users",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(14)",
                oldMaxLength: 14)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
