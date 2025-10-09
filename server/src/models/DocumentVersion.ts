import { Model, DataTypes, Sequelize, Optional } from "sequelize";

// Define the attributes of the DocumentVersion model
interface DocumentVersionAttributes {
  id: string;
  documentId: string;
  content: string;
  version: number;
  operation: object; // Store the OT operation that created this version
  userId: string;
  readonly createdAt: Date;
}

// Define the attributes required to create a new DocumentVersion
interface DocumentVersionCreationAttributes
  extends Optional<DocumentVersionAttributes, "id" | "createdAt"> {}

// Define the DocumentVersion instance
interface DocumentVersionInstance
  extends Model<DocumentVersionAttributes, DocumentVersionCreationAttributes>,
    DocumentVersionAttributes {
  [key: string]: any;
}

// Define the static methods of the DocumentVersion model
type DocumentVersionModelStatic = typeof Model & {
  new (values?: object, options?: any): DocumentVersionInstance;
  associate?: (models: any) => void;
  findByPk: (id: string, options?: any) => Promise<DocumentVersionInstance | null>;
  findOne: (options: any) => Promise<DocumentVersionInstance | null>;
};

// Define the model initialization function
const DocumentVersion = (sequelize: Sequelize): DocumentVersionModelStatic => {
  const DocumentVersion = sequelize.define<DocumentVersionInstance>(
    "DocumentVersion",
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
          model: "Documents",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      operation: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: "The OT operation that created this version",
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
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "DocumentVersions",
      timestamps: true,
      underscored: true,
      updatedAt: false, // Versions are immutable
      indexes: [
        {
          fields: ["document_id", "version"],
          unique: true,
        },
        {
          fields: ["document_id"],
        },
        {
          fields: ["user_id"],
        },
        {
          fields: ["created_at"],
        },
      ],
    }
  ) as DocumentVersionModelStatic;

  // Define associations
  DocumentVersion.associate = (models: any) => {
    DocumentVersion.belongsTo(models.Document, {
      foreignKey: "documentId",
      as: "document",
    });
    
    DocumentVersion.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return DocumentVersion;
};

export default DocumentVersion;

export type { DocumentVersionInstance, DocumentVersionAttributes, DocumentVersionCreationAttributes };
