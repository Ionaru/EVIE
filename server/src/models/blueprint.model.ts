import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseModel } from './base.model';
import { Character } from './character.model';

@Entity()
export class Blueprint extends BaseModel {

    @Column()
    public typeId: number;

    @Column({
        default: 0,
        type: Number,
    })
    public materialEfficiency = 0;

    @Column({
        default: 0,
        type: Number,
    })
    public timeEfficiency = 0;

    @Column({
        default: false,
        type: Boolean,
    })
    public isCopy = false;

    @ManyToOne(() => Character, (character) => character.blueprints, {
        onDelete: 'CASCADE',
    })
    public character!: Character;

    public constructor(id: number, typeId: number) {
        super();
        this.id = id;
        this.typeId = typeId;
    }
}
