import { 
  Table, 
  Column, 
  Model, 
  DataType, 
  ForeignKey, 
  BelongsTo, 
  HasMany, 
  PrimaryKey, 
  Default,
  AllowNull,
  Index,
  BeforeCreate,
  BeforeUpdate,
  CreatedAt,
  UpdatedAt,
  DeletedAt
} from 'sequelize-typescript';
import { User } from './User.js';
import type { Optional } from 'sequelize';

// Document interface
// Export the Document model type
export type DocumentModel = typeof Document;

export interface IDocument {
  id: string;
  name: string;
  content: string;
  language: string;
  version: number;
  ownerId: string;
  roomId?: string;
  isPublic: boolean;
  visibility: DocumentVisibility;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export enum DocumentVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  UNLISTED = 'unlisted'
}

@Table({
  tableName: 'documents',
  timestamps: true,
  paranoid: true,
  version: true,
  underscored: true,
  indexes: [
    {
      name: 'documents_owner_id_idx',
      fields: ['owner_id']
    },
    {
      name: 'documents_room_id_idx',
      fields: ['room_id']
    },
    {
      name: 'documents_visibility_idx',
      fields: ['visibility']
    }
  ]
})
export class Document extends Model<IDocument, Optional<IDocument, 'id'>> implements IDocument {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
    primaryKey: true
  })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: ''
  })
  declare content: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'plaintext'
  })
  declare language: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  declare version: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    field: 'owner_id',
    allowNull: false
  })
  declare ownerId: string;

  @BelongsTo(() => User, {
    foreignKey: 'ownerId',
    targetKey: 'id',
    as: 'owner',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  declare owner: User;

  @Column({
    type: DataType.UUID,
    field: 'room_id',
    allowNull: true
  })
  declare roomId?: string;

  @Column({
    type: DataType.BOOLEAN,
    field: 'is_public',
    allowNull: false,
    defaultValue: false
  })
  declare isPublic: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(DocumentVisibility)),
    allowNull: false,
    defaultValue: DocumentVisibility.PRIVATE
  })
  declare visibility: DocumentVisibility;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
    allowNull: false,
    defaultValue: DataType.NOW
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
    allowNull: false,
    defaultValue: DataType.NOW
  })
  declare updatedAt: Date;

  @DeletedAt
  @Column({
    type: DataType.DATE,
    field: 'deleted_at',
    allowNull: true
  })
  declare deletedAt?: Date;
}

export default Document;

// Export model instance type for use in associations
export type DocumentInstance = InstanceType<typeof Document>;

// Document creation attributes
export type DocumentCreationAttributes = Optional<IDocument, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

// Associate models
export function associate(models: any) {
  Document.belongsTo(models.User, {
    foreignKey: 'ownerId',
    as: 'owner',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  // Add any other associations here
  // For example, if you have a Room model:
  // Document.belongsTo(models.Room, {
  //   foreignKey: 'roomId',
  //   as: 'room',
  //   onDelete: 'SET NULL',
  //   onUpdate: 'CASCADE'
  // });
}

