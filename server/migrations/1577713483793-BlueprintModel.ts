import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class BlueprintModel1577713483793 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('CREATE TABLE `blueprint` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(36) NOT NULL, `createdOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedOn` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `typeId` int NOT NULL, `materialEfficiency` int NOT NULL DEFAULT 0, `timeEfficiency` int NOT NULL DEFAULT 0, `isCopy` tinyint NOT NULL DEFAULT 0, `characterId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
        await queryRunner.query('ALTER TABLE `blueprint` ADD CONSTRAINT `FK_7e712c145c33fe8276222c9c558` FOREIGN KEY (`characterId`) REFERENCES `character`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `blueprint` DROP FOREIGN KEY `FK_7e712c145c33fe8276222c9c558`', undefined);
        await queryRunner.query('DROP TABLE `blueprint`', undefined);
    }

}
