import { Column, Entity, OneToMany, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { Character, ISanitizedCharacter } from './character.model';

interface ISanitizedUser {
    characters: ISanitizedCharacter[];
    isAdmin: boolean;
    uuid: string;
}

@Entity()
export class User extends BaseModel {

    @Column({
        default: false,
        type: Boolean,
    })
    public isAdmin = false;

    @Column({
        default: 1,
        type: Number,
    })
    public timesLogin = 1;

    @Column({
        default: () => 'CURRENT_TIMESTAMP',
    })
    public lastLogin: Date = new Date();

    @OneToMany(() => Character, (character) => character.user)
    public characters!: Character[];

    public get sanitizedCopy(): ISanitizedUser {

        const characters = this.characters ? this.characters.map((character) => character.sanitizedCopy) : [];

        return {
            characters,
            isAdmin: this.isAdmin,
            uuid: this.uuid,
        };
    }

    public static doQuery(): SelectQueryBuilder<User> {
        return this.createQueryBuilder('user');
    }

    public static async getFromId(id: number): Promise<User | undefined> {
        return User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id})
            .getOne();
    }

    public async merge(userToMerge: User): Promise<void> {
        // Move Characters to new User
        await Character.doQuery()
            .update()
            .set({user: this})
            .where('character.userId = :userId', {userId: userToMerge.id})
            .execute();

        // Copy relevant information from the old User to the new User.
        await User.doQuery()
            .update()
            .set({
                isAdmin: userToMerge.isAdmin || this.isAdmin,
                timesLogin: userToMerge.timesLogin + this.timesLogin,
            })
            .where('user.id = :id', {id: this.id})
            .execute();

        // Delete the old User
        User.delete(userToMerge.id).then();
    }
}
