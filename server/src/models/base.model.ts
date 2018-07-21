import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Generated,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity()
export class BaseModel extends BaseEntity {

    public static async deleteAll(): Promise<void> {
        await this.createQueryBuilder()
            .delete()
            .from(this)
            .execute();
    }

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    @Generated('uuid')
    public uuid!: string;

    @CreateDateColumn()
    public createdOn!: Date;

    @UpdateDateColumn()
    public updatedOn!: Date;
}
