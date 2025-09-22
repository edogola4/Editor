export const up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    username: { 
      type: 'varchar(100)', 
      notNull: true, 
      unique: true 
    },
    email: { 
      type: 'varchar(255)', 
      notNull: true, 
      unique: true 
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable('users');
};