import type { RemoteLibraryType } from '@server/constants/server';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class RemoteLibrary {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column({ type: 'varchar' })
  public type: RemoteLibraryType;

  @Column()
  public hostname: string;

  @Column()
  public port: number;

  @Column({ default: false })
  public useSsl: boolean;

  @Column({ nullable: true })
  public baseUrl?: string;

  @Column({ nullable: true })
  public apiKey?: string;

  @Column({ nullable: true })
  public plexToken?: string;

  @Column({ default: true })
  public isEnabled: boolean;

  @Column({ default: true })
  public syncEnabled: boolean;

  @Column({ nullable: true, type: 'datetime' })
  public lastSyncAt?: Date;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
