const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure database directory exists
const dbDir = path.dirname(process.env.DB_PATH || './database/tasks.db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(process.env.DB_PATH || './database/tasks.db');

// Database schema with PostgreSQL compatibility
const schemas = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  tasks: `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      deadline DATETIME,
      priority VARCHAR(10) CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
      category VARCHAR(50) DEFAULT 'General',
      status VARCHAR(20) CHECK (status IN ('Pending', 'In Progress', 'Completed')) DEFAULT 'Pending',
      reminder_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ai_generated BOOLEAN DEFAULT FALSE,
      confidence_score REAL DEFAULT 0.0
    )
  `,
  
  notifications: `
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      scheduled_for DATETIME,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
};

// Initialize database
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log('Starting database initialization...');
    
    db.serialize(() => {
      let completedOperations = 0;
      const totalOperations = Object.keys(schemas).length + 1 + 6; // tables + user + indexes
      
      // Create tables with error handling
      Object.entries(schemas).forEach(([tableName, schema]) => {
        db.run(schema, (err) => {
          if (err) {
            console.error(`Error creating table ${tableName}:`, err);
            reject(err);
            return;
          }
          console.log(`✅ Created table: ${tableName}`);
          completedOperations++;
          
          if (completedOperations === totalOperations) {
            console.log('✅ Database initialized successfully');
            resolve();
          }
        });
      });
      
      // Create default admin user
      const bcrypt = require('bcryptjs');
      const adminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@12', 10);
      
      db.run(`
        INSERT OR IGNORE INTO users (id, name, email, password_hash) 
        VALUES (1, 'Admin', 'admin@smarttodo.com', ?)
      `, [adminPassword], (err) => {
        if (err) {
          console.error('Error creating admin user:', err);
          reject(err);
          return;
        }
        console.log('✅ Created admin user');
        completedOperations++;
        
        if (completedOperations === totalOperations) {
          console.log('✅ Database initialized successfully');
          resolve();
        }
      });
      
      // Create indexes for better performance
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
        'CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)',
        'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for)'
      ];
      
      indexes.forEach((index, i) => {
        db.run(index, (err) => {
          if (err) {
            console.error(`Error creating index ${i}:`, err);
            reject(err);
            return;
          }
          console.log(`✅ Created index ${i + 1}/${indexes.length}`);
          completedOperations++;
          
          if (completedOperations === totalOperations) {
            console.log('✅ Database initialized successfully');
            resolve();
          }
        });
      });
    });
  });
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase, db };
