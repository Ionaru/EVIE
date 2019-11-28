import {MigrationInterface, QueryRunner} from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class RemoveEmail1574949747885 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `user` DROP COLUMN `email`', undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('ALTER TABLE `user` ADD `email` varchar(255) NULL', undefined);
    }

}
