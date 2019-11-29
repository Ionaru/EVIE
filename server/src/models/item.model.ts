import { Entity, ManyToOne, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { Character } from './character.model';

@Entity()
export class Item extends BaseModel {

    public static doQuery(): SelectQueryBuilder<Item> {
        return this.createQueryBuilder('item');
    }

    public static getFromId(id: number) {
        return Item.doQuery()
            .where('item.id = :id', {id})
            .getOne();
    }

    @ManyToOne(() => Character, (character) => character.items, {
        onDelete: 'CASCADE',
    })
    public character!: Character;
}
