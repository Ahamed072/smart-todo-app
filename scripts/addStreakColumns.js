const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const db = new sqlite3.Database(process.env.DB_PATH || './database/tasks.db');

function addStreakColumns() {
  return new Promise((resolve, reject) => {
    console.log('Adding streak columns to users table...');
    
    db.serialize(() => {
      // Add streak columns
      const alterQueries = [
        'ALTER TABLE users ADD COLUMN current_streak INTEGER DEFAULT 0',
        'ALTER TABLE users ADD COLUMN longest_streak INTEGER DEFAULT 0', 
        'ALTER TABLE users ADD COLUMN last_activity_date DATE',
        'ALTER TABLE users ADD COLUMN total_days_active INTEGER DEFAULT 0'
      ];
      
      let completed = 0;
      
      alterQueries.forEach((query, index) => {
        db.run(query, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error(`Error adding column ${index}:`, err);
            reject(err);
            return;
          }
          
          completed++;
          console.log(`✅ Added streak column ${index + 1}/4`);
          
          if (completed === alterQueries.length) {
            console.log('✅ All streak columns added successfully');
            resolve();
          }
        });
      });
    });
  });
}

if (require.main === module) {
  addStreakColumns()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addStreakColumns;