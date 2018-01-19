import { Column, Entity, JoinColumn, OneToOne, SelectQueryBuilder } from 'typeorm';

import { BaseModel } from './base.model';
import { User } from './user.model';

interface ISettings {
    theme: 'light' | 'dark';
}

@Entity()
export class Settings extends BaseModel {

    public static doQuery(): SelectQueryBuilder<Settings> {
        return this.createQueryBuilder('settings');
    }

    @OneToOne(() => User, (user) => user.settings)
    @JoinColumn()
    public user: User;

    @Column({
        type: 'text',
    })
    private _data: string;

    constructor(content?: ISettings) {
        super();

        if (content) {
            this.data = content;
        } else {
            this.data = {
                theme: 'dark',
            };
        }
    }

    public get data() {
        return JSON.parse(this._data) as ISettings;
    }

    public set data(content: ISettings) {
        this._data = JSON.stringify(content);
    }

    public get sanitizedCopy() {
        // Delete data that should not be sent to the client.
        const copy = Object.assign({}, this);
        delete copy.id;
        delete copy.createdOn;
        delete copy.updatedOn;
        return copy;
    }
}
