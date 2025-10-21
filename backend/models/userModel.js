const pool = require('../db');

const findByUsername = async (username) => {
    const [rows] = await pool.query(
        'SELECT * FROM TAI_KHOAN WHERE TENDANGNHAP = ?',
        [username]
    );
    return rows[0];
};

const getUserById = async (user_id) => {
    const [rows] = await pool.query(
        'SELECT * FROM TAI_KHOAN WHERE MATAIKHOAN = ?',
        [user_id]
    );
    return rows[0];
};

const getAllUsers = async () => {
    const [rows] = await pool.query(
        'SELECT MATAIKHOAN, TENDANGNHAP, HOTEN, CHUCVU FROM TAI_KHOAN'
    );
    return rows;
};

const isUsernameTaken = async (username) => {
    const [rows] = await pool.query(
        'SELECT COUNT(*) AS count FROM TAI_KHOAN WHERE TENDANGNHAP = ?',
        [username]
    );
    return rows[0].count > 0;
};

const createUser = async (username, hash, full_name, role) => {
    const [result] = await pool.query(
        'INSERT INTO TAI_KHOAN (TENDANGNHAP, MATKHAU, HOTEN, CHUCVU) VALUES (?, ?, ?, ?)',
        [username, hash, full_name || '', role || 'CAN_BO_NGHIEP_VU']
    );
    return result;
};

const updateUser = async (user_id, full_name, username, password, role, status) => {
    const [result] = await pool.query(
        'UPDATE TAI_KHOAN SET HOTEN = ?, TENDANGNHAP = ?, MATKHAU = ?, CHUCVU = ?, TRANGTHAI = ? WHERE MATAIKHOAN = ?',
        [full_name, username, password, role, status, user_id]
    );
    return result;
};

const deleteUser = async (user_id) => {
    const [result] = await pool.query(
        'DELETE FROM TAI_KHOAN WHERE MATAIKHOAN = ?',
        [user_id]
    );
    return result;
};

module.exports = {
    findByUsername,
    getUserById,
    getAllUsers,
    isUsernameTaken,
    createUser,
    updateUser,
    deleteUser,
};
