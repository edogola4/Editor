import { Model, DataTypes, Sequelize, Optional } from "sequelize";

// Define the attributes of the Operation model
interface OperationAttributes {
  id: string;
  documentId: string;
  userId: string;
  operation: string; // JSON string containing the operation data
  version: number;
  timestamp: Date;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// Define the attributes required to create a new Operation
interface OperationCreationAttributes
  extends Optional<OperationAttributes, "id" | "timestamp" | "createdAt" | "updatedAt"> {}

// Define the Operation instance
interface OperationInstance
  extends Model<OperationAttributes, OperationCreationAttributes>,
    OperationAttributes {
  [key: string]: any;
}

// Define the static methods of the Operation model
type OperationModelStatic = typeof Model & {
  new (values?: object, options?: any): OperationInstance;
  associate?: (models: any) => void;
  findByPk: (id: string, options?: any) => Promise<OperationInstance | null>;
  findOne: (options: any) => Promise<OperationInstance | null>;
};

// Define the model initialization function
const Operation = (sequelize: Sequelize): OperationModelStatic => {
  const Operation = sequelize.define<OperationInstance>(
    "Operation",
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
      operation: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
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
      tableName: "operations",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["document_id"],
        },
        {
          fields: ["user_id"],
        },
        {
          fields: ["document_id", "version"],
          unique: true,
        },
        {
          fields: ["timestamp"],
        },
      ],
    }
  ) as OperationModelStatic;

  // Define associations
  Operation.associate = (models: any) => {
    Operation.belongsTo(models.Document, {
      foreignKey: "documentId",
      as: "document",
    });

    Operation.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Operation;
};

export default Operation;

export type { OperationInstance, OperationAttributes, OperationCreationAttributes };

