import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, SelectQueryBuilder } from 'typeorm';

import { Character } from './character.model';

@Entity()
export class User extends BaseEntity {

    public static doQuery(): SelectQueryBuilder<User> {
        return this.createQueryBuilder('user');
    }

    @PrimaryGeneratedColumn()
    public id: number;

    @Column({
        unique: true,
    })
    public pid: string;

    @Column({
        unique: true,
    })
    public username: string;

    @Column({
        unique: true,
    })
    public passwordHash: string;

    @Column({
        unique: true,
    })
    public email: string;

    @Column({
        default: 0,
    })
    public timesLogin: number;

    @Column({
        default: () => 'CURRENT_TIMESTAMP',
    })
    public lastLogin: Date;

    @OneToMany(() => Character, (character) => character.user)
    public characters: Character[];
}
