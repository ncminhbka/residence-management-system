const pool = require('../db');



findByUsername = async (username) => {
    const [rows] = await pool.query('SELECT * FROM tai_khoan WHERE TENDANGNHAP = ?', [username]);
    return rows[0];
}
getUserById = async (user_id) => {
    const [rows] = await pool.query('SELECT * FROM tai_khoan WHERE MATAIKHOAN = ?', [user_id]);
    return rows[0];
}
createUser = async (username, hash, full_name, role) => {
    const [result] = await pool.query(
      'INSERT INTO tai_khoan (TENDANGNHAP, MATKHAU, HOTEN, CHUCVU) VALUES (?, ?, ?, ?)',
      [username, hash, full_name, role || 'CAN_BO_NGHIEP_VU']
    );
    return result;
}

module.exports = {
    findByUsername,
    createUser,
    getUserById
};
    