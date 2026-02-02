using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNetApp.Migrations
{
    /// <inheritdoc />
    public partial class AllowDeleteStatusWithQuotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Statuses_Statuses_QuotedStatusId",
                table: "Statuses");

            migrationBuilder.AddForeignKey(
                name: "FK_Statuses_Statuses_QuotedStatusId",
                table: "Statuses",
                column: "QuotedStatusId",
                principalTable: "Statuses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Statuses_Statuses_QuotedStatusId",
                table: "Statuses");

            migrationBuilder.AddForeignKey(
                name: "FK_Statuses_Statuses_QuotedStatusId",
                table: "Statuses",
                column: "QuotedStatusId",
                principalTable: "Statuses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
