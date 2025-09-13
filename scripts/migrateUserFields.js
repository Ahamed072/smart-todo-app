require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(process.env.DB_PATH || './database/tasks.db');

async function addUserNameFields() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Adding first_name and last_name fields to users table...');
    
    db.serialize(() => {
      // Add first_name column
      db.run(`ALTER TABLE users ADD COLUMN first_name VARCHAR(50)`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding first_name column:', err);
          reject(err);
          return;
        }
        console.log('✅ Added first_name column');
      });

      // Add last_name column
      db.run(`ALTER TABLE users ADD COLUMN last_name VARCHAR(50)`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding last_name column:', err);
          reject(err);
          return;
        }
        console.log('✅ Added last_name column');
      });

      // Add username column for login (without UNIQUE constraint first)
      db.run(`ALTER TABLE users ADD COLUMN username VARCHAR(50)`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding username column:', err);
          reject(err);
          return;
        }
        console.log('✅ Added username column');
        resolve();
      });
    });
  });
}

// Run migration
if (require.main === module) {
  addUserNameFields()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addUserNameFields };