const knex = require('knex');
const path = require('path');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, '../../database.sqlite')
  },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, cb) => {
      conn.run('PRAGMA foreign_keys = ON', cb);
    }
  }
});

const connectDB = async () => {
  try {
    // Test the connection
    await db.raw('SELECT 1+1 as result');
    console.log('SQLite database connected successfully');
    
    // Run migrations
    await runMigrations();
  } catch (error) {
    console.error('SQLite connection error:', error.message);
    process.exit(1);
  }
};

const runMigrations = async () => {
  try {
    // Check if migrations table exists
    const hasMigrationsTable = await db.schema.hasTable('knex_migrations');
    
    if (!hasMigrationsTable) {
      // Create tables
      await createTables();
      console.log('Database tables created successfully');
    }
  } catch (error) {
    console.error('Migration error:', error.message);
  }
};

const createTables = async () => {
  try {
    // Create users table
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.boolean('verified').defaultTo(false);
      table.string('themePreference').defaultTo('light');
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.index('email');
    });

    // Create otp table
    await db.schema.createTable('otp', (table) => {
      table.increments('id').primary();
      table.string('email').notNullable();
      table.string('code').notNullable();
      table.timestamp('expiration').notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.index('email');
    });

    // Create predictions table
    await db.schema.createTable('predictions', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.text('text').notNullable();
      table.string('file_name');
      table.string('file_type').defaultTo('manual');
      table.string('prediction').notNullable();
      table.float('confidence').notNullable();
      table.text('explanation').notNullable();
      table.text('red_flags');
      table.text('recommendations');
      table.text('metadata');
      table.timestamp('created_at').defaultTo(db.fn.now());
      
      // Foreign key constraint
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.index('user_id');
      table.index('created_at');
    });

    // Create knex_migrations table (for future migrations)
    await db.schema.createTable('knex_migrations', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.integer('batch').notNullable();
      table.timestamp('migration_time').defaultTo(db.fn.now());
    });

    // Insert initial migration record
    await db('knex_migrations').insert({
      name: 'initial',
      batch: 1
    });

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Table creation error:', error.message);
    throw error;
  }
};

module.exports = { db, connectDB };
