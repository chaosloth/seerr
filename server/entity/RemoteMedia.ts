import { MediaStatus } from '@server/constants/media';
import Media from '@server/entity/Media';
import { RemoteLibrary } from '@server/entity/RemoteLibrary';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['media', 'remoteLibrary'], { unique: true })
export class RemoteMedia {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => Media, { onDelete: 'CASCADE' })
  public media: Media;

  @ManyToOne(() => RemoteLibrary, { onDelete: 'CASCADE' })
  public remoteLibrary: RemoteLibrary;

  @Column({ default: MediaStatus.UNKNOWN })
  public status: MediaStatus;

  @Column({ nullable: true })
  public remoteId?: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
