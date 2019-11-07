import { MigrationInterface, QueryRunner } from 'typeorm';

interface IBaseData {
    id: number;
    uuid: string;
    createdOn: Date;
    updatedOn: Date;
}

interface IUserData extends IBaseData {
    email: string;
    isAdmin: string;
    timesLogin: number;
    lastLogin: Date;
}

interface ICharacterData extends IBaseData {
    name: string;
    characterId: number;
    accessToken: string;
    tokenExpiry: Date;
    refreshToken: string;
    scopes: string;
    ownerHash: string;
    isActive: number;
    userId: number;
}

// noinspection JSUnusedGlobalSymbols
export class Initial1573054086025 implements MigrationInterface {

    private static convertDate(date: Date): string {
        const seconds = Math.floor(date.getTime() / 1000);
        return `from_unixtime(${seconds})`;
    }

    private static async migrateCharacterTable(queryRunner: QueryRunner) {
        let characterData: ICharacterData[] = [];
        const characterTableExists = await queryRunner.query(`SHOW TABLES LIKE 'character'`);
        if (characterTableExists.length) {
            characterData = await queryRunner.query('SELECT * FROM `character`');
        }

        // Drop old table
        await queryRunner.query('DROP TABLE IF EXISTS `character`');

        await queryRunner.query('CREATE TABLE `character` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(36) NOT NULL, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `name` varchar(255) NULL, `characterId` int NULL, `accessToken` text NULL, `tokenExpiry` datetime NULL, `refreshToken` varchar(255) NULL, `scopes` text NULL, `ownerHash` varchar(255) NULL, `isActive` tinyint NOT NULL DEFAULT 0, `userId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);

        if (characterData.length) {
            const characterValues = characterData.map((data) => `(${data.id},'${data.uuid}',${Initial1573054086025.convertDate(data.createdOn)},${Initial1573054086025.convertDate(data.updatedOn)},'${data.name}',${data.characterId},'${data.accessToken}',${Initial1573054086025.convertDate(data.tokenExpiry)},'${data.refreshToken}','${data.scopes}','${data.ownerHash}',${data.isActive},${data.userId})`);
            await queryRunner.query(`INSERT INTO \`character\` (id, uuid, createdOn, updatedOn, name, characterId, accessToken, tokenExpiry, refreshToken, scopes, ownerHash, isActive, userId) VALUES ${characterValues.join(',')}`);
        }
    }

    private static async migrateUserTable(queryRunner: QueryRunner) {
        let userData: IUserData[] = [];
        const userTableExists = await queryRunner.query(`SHOW TABLES LIKE 'user'`);
        if (userTableExists.length) {
            userData = await queryRunner.query('SELECT * FROM `user`');
        }

        // Drop old table
        await queryRunner.query('DROP TABLE IF EXISTS `user`');

        await queryRunner.query('CREATE TABLE `user` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(36) NOT NULL, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `email` varchar(255) NULL, `isAdmin` tinyint NOT NULL DEFAULT 0, `timesLogin` int NOT NULL DEFAULT 1, `lastLogin` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);

        if (userData.length) {
            const userValues = userData.map((data) => `(${data.id},'${data.uuid}',${Initial1573054086025.convertDate(data.createdOn)},${Initial1573054086025.convertDate(data.updatedOn)},'${data.email}',${data.isAdmin},${data.timesLogin},${Initial1573054086025.convertDate(data.lastLogin)})`);
            await queryRunner.query(`INSERT INTO \`user\` (id, uuid, createdOn, updatedOn, email, isAdmin, timesLogin, lastLogin) VALUES ${userValues.join(',')}`);
        }
    }

    public async up(queryRunner: QueryRunner): Promise<any> {
        await Initial1573054086025.migrateCharacterTable(queryRunner);
        await Initial1573054086025.migrateUserTable(queryRunner);
        await queryRunner.query('ALTER TABLE `character` ADD CONSTRAINT `FK_04c2fb52adfa5265763de8c4464` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `character` DROP FOREIGN KEY `FK_04c2fb52adfa5265763de8c4464`', undefined);
        await queryRunner.query('DROP TABLE `character`', undefined);
        await queryRunner.query('DROP TABLE `user`', undefined);
    }
}
