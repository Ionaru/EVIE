import * as clone from 'clone';
import { Column, Entity, OneToMany, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { Character } from './character.model';

@Entity()
export class User extends BaseModel {

    public static doQuery(): SelectQueryBuilder<User> {
        return this.createQueryBuilder('user');
    }

    public static async getFromId(id: number) {
        return User.doQuery()
            .leftJoinAndSelect('user.characters', 'character')
            .where('user.id = :id', {id})
            .getOne();
    }

    @Column({
        nullable: true,
    })
    public email?: string;

    @Column({
        default: false,
    })
    public isAdmin: boolean = false;

    @Column({
        default: 1,
    })
    public timesLogin: number = 1;

    @Column({
        default: () => 'CURRENT_TIMESTAMP',
    })
    public lastLogin: Date = new Date();

    @OneToMany(() => Character, (character) => character.user)
    public characters!: Character[];

    public get sanitizedCopy() {
        // Delete data that should not be sent to the client.
        const copy = clone<this>(this, false);
        delete copy.id;
        delete copy.timesLogin;
        delete copy.lastLogin;
        delete copy.createdOn;
        delete copy.updatedOn;
        copy.characters = this.characters ? this.characters.map((character) => character.sanitizedCopy) : [];
        return copy;
    }

    public async merge(userToMerge: User) {
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
                email: userToMerge.email || this.email,
                isAdmin: userToMerge.isAdmin || this.isAdmin,
                timesLogin: userToMerge.timesLogin + this.timesLogin,
            })
            .where('user.id = :id', {id: this.id})
            .execute();

        // Delete the old User
        User.delete(userToMerge.id).then();
    }
}
