import * as clone from 'clone';
import { Column, Entity, OneToMany, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { Character } from './character.model';

@Entity()
export class User extends BaseModel {

    public static doQuery(): SelectQueryBuilder<User> {
        return this.createQueryBuilder('user');
    }

    @Column({
        unique: true,
    })
    public username!: string;

    @Column({
        select: false,
        unique: true,
    })
    public passwordHash!: string;

    @Column({
        unique: true,
    })
    public email!: string;

    @Column({
        default: false,
    })
    public isAdmin!: boolean;

    @Column({
        default: 0,
    })
    public timesLogin!: number;

    @Column({
        default: () => 'CURRENT_TIMESTAMP',
    })
    public lastLogin!: Date;

    @OneToMany(() => Character, (character) => character.user)
    public characters!: Character[];

    constructor() {
        super();
    }

    public get sanitizedCopy() {
        // Delete data that should not be sent to the client.
        const copy = clone<this>(this, false);
        delete copy.id;
        delete copy.passwordHash;
        delete copy.timesLogin;
        delete copy.lastLogin;
        delete copy.createdOn;
        delete copy.updatedOn;
        copy.characters = this.characters.map((character) => character.sanitizedCopy);
        return copy;
    }
}
