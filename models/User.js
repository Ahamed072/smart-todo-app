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

  static async create(userData) {
    try {
      const { name, email, password_hash } = userData;
      const result = await db.run(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, password_hash]
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
