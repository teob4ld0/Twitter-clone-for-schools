using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNetApp.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusQuotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "QuotedStatusId",
                table: "Statuses",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Statuses_QuotedStatusId",
                table: "Statuses",
                column: "QuotedStatusId");

            migrationBuilder.AddForeignKey(
                name: "FK_Statuses_Statuses_QuotedStatusId",
                table: "Statuses",
                column: "QuotedStatusId",
                principalTable: "Statuses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Statuses_Statuses_QuotedStatusId",
                table: "Statuses");

            migrationBuilder.DropIndex(
                name: "IX_Statuses_QuotedStatusId",
                table: "Statuses");

            migrationBuilder.DropColumn(
                name: "QuotedStatusId",
                table: "Statuses");
        }
    }
}
