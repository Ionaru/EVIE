import * as clone from 'clone';
import { Column, Entity, ManyToOne, OneToMany, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { Blueprint } from './blueprint.model';
import { User } from './user.model';

@Entity()
export class Character extends BaseModel {

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
        type: Boolean,
    })
    public isActive = false;

    @OneToMany(() => Blueprint, (blueprint) => blueprint.character)
    public blueprints!: Blueprint[];

    @ManyToOne(() => User, (user) => user.characters, {
        onDelete: 'CASCADE',
    })
    public user!: User;

    public static doQuery(): SelectQueryBuilder<Character> {
        return this.createQueryBuilder('character');
    }

    public static async getFromId(id: number): Promise<Character | undefined> {
        return Character.doQuery()
            .innerJoinAndSelect('character.user', 'user')
            .where('character.characterId = :id', {id})
            .getOne();
    }

    public get sanitizedCopy(): this {
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
