import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, SelectQueryBuilder } from 'typeorm';

import { User } from './user.model';

@Entity()
export class Character extends BaseEntity {

    public static doQuery(): SelectQueryBuilder<Character> {
        return this.createQueryBuilder('character');
    }

    @PrimaryGeneratedColumn()
    public id: number;

    @Column({
        unique: true,
    })
    public pid?: string;

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
    })
    public authToken?: string;

    @Column({
        nullable: true,
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
    })
    public scopes?: string;

    @Column({
        nullable: true,
    })
    public ownerHash?: string;

    @Column({
        default: false,
    })
    public isActive: boolean;

    @ManyToOne(() => User, (user) => user.characters, {
        cascadeAll: true,
    })
    public user: User;

    public getSanitizedValues() {
        // Delete data that should not be sent to the client.
        const copy = Object.assign({}, this);
        delete copy.id;
        delete copy.authToken;
        delete copy.refreshToken;
        delete copy.user;
        return copy;
    }
}
