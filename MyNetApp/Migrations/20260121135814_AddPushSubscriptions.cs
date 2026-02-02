using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyNetApp.Migrations
{
    /// <inheritdoc />
    public partial class AddPushSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create table only if it doesn't exist
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS `PushSubscriptions` (
                    `Id` int NOT NULL AUTO_INCREMENT,
                    `UserId` int NOT NULL,
                    `Endpoint` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `P256dh` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `Auth` longtext CHARACTER SET utf8mb4 NOT NULL,
                    `IsActive` tinyint(1) NOT NULL DEFAULT 1,
                    `CreatedAt` datetime(6) NOT NULL,
                    CONSTRAINT `PK_PushSubscriptions` PRIMARY KEY (`Id`),
                    CONSTRAINT `FK_PushSubscriptions_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
                    INDEX `IX_PushSubscriptions_UserId` (`UserId`)
                ) CHARACTER SET=utf8mb4;
            ");

            // Add IsActive column if it doesn't exist
            migrationBuilder.Sql(@"
                SET @dbname = DATABASE();
                SET @tablename = 'PushSubscriptions';
                SET @columnname = 'IsActive';
                SET @preparedStatement = (SELECT IF(
                    (
                        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE
                            (TABLE_SCHEMA = @dbname)
                            AND (TABLE_NAME = @tablename)
                            AND (COLUMN_NAME = @columnname)
                    ) > 0,
                    'SELECT 1',
                    CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` tinyint(1) NOT NULL DEFAULT 1;')
                ));
                PREPARE alterIfNotExists FROM @preparedStatement;
                EXECUTE alterIfNotExists;
                DEALLOCATE PREPARE alterIfNotExists;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PushSubscriptions");
        }
    }
}
