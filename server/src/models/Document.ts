import { Model, DataTypes, Sequelize, Optional } from "sequelize";

// Define the attributes of the Document model
interface DocumentAttributes {
  id: string;
  name: string;
  content: string;
  language: string;
  version: number;
  ownerId: string;
  roomId?: string;
  isPublic: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// Define the attributes required to create a new Document
interface DocumentCreationAttributes
  extends Optional<DocumentAttributes, "id" | "version" | "createdAt" | "updatedAt"> {}

// Define the Document instance
interface DocumentInstance
  extends Model<DocumentAttributes, DocumentCreationAttributes>,
    DocumentAttributes {
  [key: string]: any;
}

// Define the static methods of the Document model
type DocumentModelStatic = typeof Model & {
  new (values?: object, options?: any): DocumentInstance;
  associate?: (models: any) => void;
  findByPk: (id: string, options?: any) => Promise<DocumentInstance | null>;
  findOne: (options: any) => Promise<DocumentInstance | null>;
};

// Define the model initialization function
export default function Document(sequelize: Sequelize): DocumentModelStatic {
  const Document = sequelize.define<DocumentInstance>(
    "Document",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Untitled Document",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      language: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "javascript",
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      roomId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "rooms",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: "Documents",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["owner_id"],
        },
        {
          fields: ["room_id"],
        },
        {
          fields: ["created_at"],
        },
      ],
    }
  ) as DocumentModelStatic;

  // Define associations
  Document.associate = (models: any) => {
    Document.belongsTo(models.User, {
      foreignKey: "ownerId",
      as: "owner",
    });
    
    Document.belongsTo(models.Room, {
      foreignKey: "roomId",
      as: "room",
    });

    Document.hasMany(models.DocumentVersion, {
      foreignKey: "documentId",
      as: "versions",
    });
  };

  return Document;
}

export type { DocumentInstance, DocumentAttributes, DocumentCreationAttributes };
