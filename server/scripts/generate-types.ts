import { Sequelize } from 'sequelize-typescript';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from '../src/config/config';

// Configure database connection
const sequelize = new Sequelize({
  database: config.db.name,
  username: config.db.user,
  password: config.db.password,
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  models: [join(__dirname, '../src/models')],
  modelMatch: (filename, member) => {
    return filename === member.toLowerCase();
  },
  logging: false,
});

// Define the output directory for types
const outputDir = join(__dirname, '../src/types');

// Create the types directory if it doesn't exist
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Generate types for each model
const generateTypes = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Get all models
    const models = sequelize.models;
    let typeDefinitions = '// Auto-generated type definitions\n\n';

    // Add common types
    typeDefinitions += `import { Model, Optional, DataTypes, ModelAttributes, ModelStatic } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';\n\n`;

    // Generate types for each model
    for (const [modelName, model] of Object.entries(models)) {
      const attributes = model.getAttributes();
      const tableName = model.getTableName();
      
      // Skip if no attributes
      if (!attributes) continue;

      // Generate interface for attributes
      typeDefinitions += `export interface ${modelName}Attributes {\n`;
      
      // Add ID field if not present
      if (!attributes.id) {
        typeDefinitions += `  id: string;\n`;
      }

      // Add other fields
      for (const [attrName, attr] of Object.entries(attributes)) {
        // Skip associations
        if (attr.references) continue;

        let type = 'any';
        const isOptional = attr.allowNull === true;
        const fieldName = attr.field || attrName;

        // Map Sequelize types to TypeScript types
        if (attr.type) {
          const typeName = attr.type.toString();
          
          if (typeName.includes('INTEGER') || 
              typeName.includes('BIGINT') || 
              typeName.includes('FLOAT') || 
              typeName.includes('DOUBLE') || 
              typeName.includes('DECIMAL')) {
            type = 'number';
          } else if (typeName.includes('BOOLEAN')) {
            type = 'boolean';
          } else if (typeName.includes('DATE')) {
            type = 'Date';
          } else if (typeName.includes('JSON')) {
            type = 'Record<string, any>';
          } else {
            type = 'string';
          }
        }

        typeDefinitions += `  ${fieldName}${isOptional ? '?' : ''}: ${type};\n`;
      }

      // Add timestamps if they exist in the model
      if (model.rawAttributes?.createdAt) {
        typeDefinitions += '  createdAt?: Date;\n';
      }
      if (model.rawAttributes?.updatedAt) {
        typeDefinitions += '  updatedAt?: Date;\n';
      }
      if (model.rawAttributes?.deletedAt) {
        typeDefinitions += '  deletedAt?: Date | null;\n';
      }

      typeDefinitions += `}\n\n`;

      // Generate creation attributes (all fields optional except required ones)
      typeDefinitions += `export type ${modelName}CreationAttributes = Optional<${modelName}Attributes, 'id'`;
      
      // Add optional fields to creation attributes
      const optionalFields = Object.entries(attributes)
        .filter(([_, attr]) => attr.allowNull === true || attr.defaultValue !== undefined)
        .map(([name, attr]) => `'${attr.field || name}'`);
      
      if (optionalFields.length > 0) {
        typeDefinitions += ` | ${optionalFields.join(' | ')}`;
      }
      
      typeDefinitions += `>;\n\n`;

      // Generate model instance type
      typeDefinitions += `export interface ${modelName}Instance extends Model<${modelName}Attributes, ${modelName}CreationAttributes>, ${modelName}Attributes {\n`;
      
      // Add associations
      const associations = model.associations || {};
      for (const [assocName, assoc] of Object.entries(associations)) {
        const targetModel = assoc.target.name;
        const isPlural = assoc.isMultiAssociation;
        
        if (isPlural) {
          typeDefinitions += `  ${assocName}?: ${targetModel}Instance[];\n`;
        } else {
          typeDefinitions += `  ${assocName}?: ${targetModel}Instance;\n`;
        }
      }
      
      typeDefinitions += `}\n\n`;

      // Generate model static type
      typeDefinitions += `export type ${modelName}Model = ModelStatic<${modelName}Instance> & {\n`;
      typeDefinitions += `  associate?: (models: { [key: string]: ModelStatic<Model> }) => void;\n`;
      typeDefinitions += `  tableName?: string;\n`;
      typeDefinitions += `};\n\n`;
    }

    // Write the type definitions to a file
    const outputPath = join(outputDir, 'models.d.ts');
    writeFileSync(outputPath, typeDefinitions, 'utf8');
    
    console.log(`Type definitions generated successfully at ${outputPath}`);
    process.exit(0);
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
};

// Run the type generation
generateTypes();
