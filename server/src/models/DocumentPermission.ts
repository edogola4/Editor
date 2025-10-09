import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export enum PermissionLevel {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

// Define the attributes of the DocumentPermission model
export interface IDocumentPermissionAttributes {
  id: string;
  documentId: string;
  userId: string;
  permission: PermissionLevel;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// Define the attributes required to create a new DocumentPermission
export interface IDocumentPermissionCreationAttributes
  extends Optional<IDocumentPermissionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define the DocumentPermission instance
export interface IDocumentPermissionInstance
  extends Model<IDocumentPermissionAttributes, IDocumentPermissionCreationAttributes>,
    IDocumentPermissionAttributes {
  [key: string]: any;
}

// Define the static methods of the DocumentPermission model
export type DocumentPermissionModelStatic = typeof Model & {
  new (values?: object, options?: any): IDocumentPermissionInstance;
  associate?: (models: any) => void;
  findByPk: (id: string, options?: any) => Promise<IDocumentPermissionInstance | null>;
  findOne: (options: any) => Promise<IDocumentPermissionInstance | null>;
};

// Export all types and enums
export type {
  IDocumentPermissionAttributes,
  IDocumentPermissionCreationAttributes,
  IDocumentPermissionInstance,
  DocumentPermissionModelStatic,
  PermissionLevel
};

// Define the model initialization function
const DocumentPermission = (sequelize: Sequelize): DocumentPermissionModelStatic => {
  const DocumentPermission = sequelize.define<IDocumentPermissionInstance>(
    "DocumentPermission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      documentId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "documents",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      permission: {
        type: DataTypes.ENUM(...Object.values(PermissionLevel)),
        allowNull: false,
        defaultValue: PermissionLevel.VIEWER,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "document_permissions",
      timestamps: true,
      underscored: true,
    }
  ) as DocumentPermissionModelStatic;

  DocumentPermission.associate = (models) => {
    DocumentPermission.belongsTo(models.Document, {
      foreignKey: "documentId",
      as: "document",
    });

    DocumentPermission.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return DocumentPermission;
};

export default DocumentPermission;
