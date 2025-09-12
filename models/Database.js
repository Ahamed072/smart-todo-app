const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.connect();
  }

  connect() {
    try {
      this.db = new sqlite3.Database(process.env.DB_PATH || './database/tasks.db');
      console.log('📦 Connected to SQLite database');
      
      // Enable foreign keys
      this.db.run('PRAGMA foreign_keys = ON');
      
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  getDb() {
    return this.db;
  }

  // Promise-based query wrapper
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Promise-based run wrapper (for INSERT, UPDATE, DELETE)
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  // Get single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Begin transaction
  beginTransaction() {
    return this.run('BEGIN TRANSACTION');
  }

  // Commit transaction
  commit() {
    return this.run('COMMIT');
  }

  // Rollback transaction
  rollback() {
    return this.run('ROLLBACK');
  }

  // Close connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
