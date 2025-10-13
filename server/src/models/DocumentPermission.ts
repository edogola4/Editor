import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import type { Document } from './Document';
import type { User } from './User';

export enum PermissionLevel {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

interface DocumentPermissionAttributes {
  id: string;
  documentId: string;
  userId: string;
  permission: PermissionLevel;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  tableName: 'document_permissions',
  timestamps: true,
  underscored: true,
  paranoid: false
})
class DocumentPermission extends Model<DocumentPermissionAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false
  })
  declare id: string;

  @ForeignKey(() => Document)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'document_id'
  })
  declare documentId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_id'
  })
  declare userId: string;

  @Column({
    type: DataType.ENUM(...Object.values(PermissionLevel)),
    allowNull: false,
    defaultValue: PermissionLevel.VIEWER
  })
  declare permission: PermissionLevel;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'expires_at'
  })
  declare expiresAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataType.NOW
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'updated_at',
    defaultValue: DataType.NOW
  })
  declare updatedAt: Date;

  // Associations will be defined in the model's associate method
  static associate(models: any) {
    // Define associations here if needed
  }
}

export default DocumentPermission;
