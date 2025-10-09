const pool = require('../db');



findByUsername = async (username) => {
    const [rows] = await pool.query('SELECT * FROM Users WHERE username = ?', [username]);
    return rows[0];
}
getUserById = async (user_id) => {
    const [rows] = await pool.query('SELECT * FROM Users WHERE user_id = ?', [user_id]);
    return rows[0];
}
createUser = async (username, hash, full_name, role) => {
    const [result] = await pool.query(
      'INSERT INTO Users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [username, hash, full_name || '', role || 'CAN_BO_NGHIEP_VU']
    );
    return result;
}

module.exports = {
    findByUsername,
    createUser,
    getUserById
};
    