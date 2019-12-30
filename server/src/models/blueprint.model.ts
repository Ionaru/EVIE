import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseModel } from './base.model';
import { Character } from './character.model';

@Entity()
export class Blueprint extends BaseModel {

    @Column()
    public typeId: number;

    @Column({
        default: 0,
    })
    public materialEfficiency: number = 0;

    @Column({
        default: 0,
    })
    public timeEfficiency: number = 0;

    @Column({
        default: false,
    })
    public isCopy: boolean = false;

    @ManyToOne(() => Character, (character) => character.blueprints, {
        onDelete: 'CASCADE',
    })
    public character!: Character;

    constructor(id: number, typeId: number) {
        super();
        this.id = id;
        this.typeId = typeId;
    }
}
