import * as clone from 'clone';
import { Column, Entity, ManyToOne, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { User } from './user.model';

@Entity()
export class Character extends BaseModel {

    public static doQuery(): SelectQueryBuilder<Character> {
        return this.createQueryBuilder('character');
    }

    public static async getFromId(id: number) {
        return Character.doQuery()
            .innerJoinAndSelect('character.user', 'user')
            .where('character.characterId = :id', {id})
            .getOne();
    }

    @Column({
        nullable: true,
    })
    public name?: string;

    @Column({
        nullable: true,
    })
    public characterId?: number;

    @Column({
        nullable: true,
        type: 'text',
    })
    public accessToken?: string;

    @Column({
        nullable: true,
    })
    public tokenExpiry?: Date;

    @Column({
        nullable: true,
    })
    public refreshToken?: string;

    @Column({
        nullable: true,
        type: 'text',
    })
    public scopes?: string;

    @Column({
        nullable: true,
    })
    public ownerHash?: string;

    @Column({
        default: false,
    })
    public isActive: boolean = false;

    @ManyToOne(() => User, (user) => user.characters, {
        onDelete: 'CASCADE',
    })
    public user!: User;

    public get sanitizedCopy() {
        // Delete data that should not be sent to the client.
        const copy = clone<this>(this);
        delete copy.id;
        delete copy.refreshToken;
        delete copy.user;
        delete copy.createdOn;
        delete copy.updatedOn;
        delete copy.characterId;
        delete copy.ownerHash;
        delete copy.tokenExpiry;
        delete copy.name;
        delete copy.scopes;
        return copy;
    }
}
