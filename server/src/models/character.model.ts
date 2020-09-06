import { Column, Entity, ManyToOne, OneToMany, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { Blueprint } from './blueprint.model';
import { User } from './user.model';

export interface ISanitizedCharacter {
    uuid: string;
    isActive: boolean;
    accessToken?: string;
}

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

    public get sanitizedCopy(): ISanitizedCharacter {
        return {
            accessToken: this.accessToken,
            isActive: this.isActive,
            uuid: this.uuid,
        };
    }
}
