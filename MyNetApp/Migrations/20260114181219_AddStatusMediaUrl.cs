using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNetApp.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusMediaUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
			migrationBuilder.AddColumn<string>(
				name: "MediaUrl",
				table: "Statuses",
				type: "longtext",
				nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
			migrationBuilder.DropColumn(
				name: "MediaUrl",
				table: "Statuses");
        }
    }
}
