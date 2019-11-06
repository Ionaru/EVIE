import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class Initial1573054086025 implements MigrationInterface {
    public name = 'Initial1573054086025';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE TABLE `user` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(36) NOT NULL, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `email` varchar(255) NULL, `isAdmin` tinyint NOT NULL DEFAULT 0, `timesLogin` int NOT NULL DEFAULT 1, `lastLogin` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('CREATE TABLE `character` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(36) NOT NULL, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `name` varchar(255) NULL, `characterId` int NULL, `accessToken` text NULL, `tokenExpiry` datetime NULL, `refreshToken` varchar(255) NULL, `scopes` text NULL, `ownerHash` varchar(255) NULL, `isActive` tinyint NOT NULL DEFAULT 0, `userId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('ALTER TABLE `character` ADD CONSTRAINT `FK_04c2fb52adfa5265763de8c4464` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `character` DROP FOREIGN KEY `FK_04c2fb52adfa5265763de8c4464`', undefined);
        await queryRunner.query('DROP TABLE `character`', undefined);
        await queryRunner.query('DROP TABLE `user`', undefined);
    }
}
