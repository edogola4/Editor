import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, Default } from 'sequelize-typescript';
import { User } from './User';
import DocumentPermission from './DocumentPermission';
import Operation from './Operation';

export enum DocumentVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  UNLISTED = 'unlisted'
}

@Table({
  tableName: 'documents',
  timestamps: true,
  version: true,
  underscored: true
})
export class Document extends Model {

  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false
  })
  id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: ''
  })
  content!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'plaintext'
  })
  language!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  version!: number;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  ownerId!: string;

  @Column(DataType.UUID)
  roomId?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  isPublic!: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(DocumentVisibility)),
    allowNull: false,
    defaultValue: DocumentVisibility.PRIVATE
  })
  visibility!: DocumentVisibility;

  // Timestamps
  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.DATE)
  updatedAt!: Date;

  @Column(DataType.DATE)
  deletedAt?: Date;

  // Associations
  @BelongsTo(() => User, 'ownerId')
  owner!: User;

  @HasMany(() => DocumentPermission, 'documentId')
  permissions!: DocumentPermission[];

  @HasMany(() => Operation, 'documentId')
  operations!: Operation[];

  // Instance methods
  async incrementVersion(): Promise<this> {
    this.version += 1;
    return this.save();
  }

  toJSON(): any {
    const values = { ...this.get() };
    return values;
  }
};

// Export interfaces for type safety
export interface IDocument extends Document {}

export default Document;
