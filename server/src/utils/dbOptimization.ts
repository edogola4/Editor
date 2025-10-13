import { Sequelize, QueryTypes } from 'sequelize';
import { redisClient } from './redis';

type IndexInfo = {
  tableName: string;
  indexName: string;
  columnName: string;
};

export async function createIndexes(sequelize: Sequelize): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const transaction = await sequelize.transaction();
  
  try {
    // Create indexes for frequently queried columns
    const indexes: Array<{
      table: string;
      columns: string[];
      unique?: boolean;
      where?: string;
    }> = [
      // User indexes
      { table: 'Users', columns: ['email'], unique: true },
      { table: 'Users', columns: ['github_id'] },
      
      // Document indexes
      { table: 'Documents', columns: ['owner_id'] },
      { table: 'Documents', columns: ['room_id'] },
      { table: 'Documents', columns: ['is_public'] },
      
      // Document Permission indexes
      { table: 'DocumentPermissions', columns: ['document_id', 'user_id'], unique: true },
      { table: 'DocumentPermissions', columns: ['user_id'] },
      
      // Room indexes
      { table: 'Rooms', columns: ['owner_id'] },
      { table: 'Rooms', columns: ['is_public'] },
      
      // Room Member indexes
      { table: 'RoomMembers', columns: ['room_id', 'user_id'], unique: true },
      { table: 'RoomMembers', columns: ['user_id'] },
      
      // Operation indexes
      { table: 'Operations', columns: ['document_id', 'version'] },
      { table: 'Operations', columns: ['document_id', 'created_at'] },
      
      // Session indexes
      { table: 'Sessions', columns: ['sid'], unique: true },
      { table: 'Sessions', columns: ['user_id'] },
      { table: 'Sessions', columns: ['expires'] },
    ];

    // Get existing indexes
    const existingIndexes = await sequelize.query<IndexInfo>(
      `SELECT 
        tablename as "tableName",
        indexname as "indexName",
        indexdef as "columnName"
      FROM pg_indexes 
      WHERE schemaname = 'public'`,
      { type: QueryTypes.SELECT, transaction }
    );

    // Create missing indexes
    for (const { table, columns, unique, where } of indexes) {
      const indexName = `idx_${table.toLowerCase()}_${columns.join('_').toLowerCase()}`;
      
      const indexExists = existingIndexes.some(
        idx => idx.tableName === table.toLowerCase() && 
               idx.columnName.includes(columns[0])
      );

      if (!indexExists) {
        const columnsList = columns.map(col => `"${col}"`).join(', ');
        let query = `CREATE ${unique ? 'UNIQUE ' : ''}INDEX "${indexName}" ON "${table}" (${columnsList})`;
        
        if (where) {
          query += ` WHERE ${where}`;
        }
        
        await sequelize.query(query, { transaction });
        console.log(`✅ Created index ${indexName} on ${table}(${columns.join(', ')})`);
      }
    }

    // Add partial indexes for soft-deleted records
    const softDeleteIndexes = [
      { table: 'Users', column: 'deleted_at' },
      { table: 'Documents', column: 'deleted_at' },
      { table: 'Rooms', column: 'deleted_at' },
    ];

    for (const { table, column } of softDeleteIndexes) {
      const indexName = `idx_${table.toLowerCase()}_${column}`;
      
      const indexExists = existingIndexes.some(
        idx => idx.indexName === indexName
      );

      if (!indexExists) {
        await sequelize.query(
          `CREATE INDEX "${indexName}" ON "${table}" ("${column}") WHERE "${column}" IS NULL`,
          { transaction }
        );
        console.log(`✅ Created partial index ${indexName} for soft deletes`);
      }
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating indexes:', error);
    throw error;
  }
}

// Query result cache with Redis
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  if (!redisClient) {
    return await fn();
  }

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Redis cache get error:', error);
  }

  const result = await fn();

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(result));
  } catch (error) {
    console.error('Redis cache set error:', error);
  }

  return result;
}

// Clear cache for a specific pattern
export async function clearCache(pattern: string): Promise<void> {
  if (!redisClient) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Optimize database tables
export async function optimizeTables(sequelize: Sequelize): Promise<void> {
  try {
    // Analyze tables for better query planning
    await sequelize.query('ANALYZE', { raw: true });
    
    // For SQLite, run VACUUM to optimize the database file
    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.query('VACUUM', { raw: true });
    } else if (sequelize.getDialect() === 'postgres') {
      // For PostgreSQL, run VACUUM and ANALYZE
      await sequelize.query('VACUUM ANALYZE', { raw: true });
    }
    
    console.log('Database optimization completed');
  } catch (error) {
    console.error('Error optimizing database:', error);
    throw error;
  }
}
