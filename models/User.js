const db = require('./Database');

class User {
  static async findById(id) {
    try {
      const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
      return user;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      return user;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  static async findByUsername(username) {
    try {
      const user = await db.get('SELECT * FROM users WHERE username = ? OR name = ?', [username, username]);
      return user;
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const { first_name, last_name, username, email, password_hash } = userData;
      const full_name = `${first_name} ${last_name}`.trim();
      
      const result = await db.run(
        'INSERT INTO users (first_name, last_name, name, username, email, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [first_name, last_name, full_name, username, email, password_hash]
      );
      
      return this.findById(result.id);
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async update(id, userData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(userData).forEach(key => {
        if (userData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(userData[key]);
        }
      });
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      values.push(new Date().toISOString());
      values.push(id);
      
      await db.run(
        `UPDATE users SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`,
        values
      );
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  static async getAll() {
    try {
      const users = await db.query('SELECT id, name, email, created_at, updated_at FROM users');
      return users;
    } catch (error) {
      throw new Error(`Error getting all users: ${error.message}`);
    }
  }
}

module.exports = User;
