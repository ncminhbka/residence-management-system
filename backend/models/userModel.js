const pool = require('../db');

// === Lấy user theo username ===
const findByUsername = async (username) => {
  const [rows] = await pool.query(
    'SELECT * FROM TAI_KHOAN WHERE TENDANGNHAP = ?',
    [username]
  );
  return rows[0];
};

// === Lấy user theo ID ===
const getUserById = async (user_id) => {
  const [rows] = await pool.query(
    'SELECT * FROM TAI_KHOAN WHERE MATAIKHOAN = ?',
    [user_id]
  );
  return rows[0];
};

// === Lấy danh sách user ===
const getAllUsers = async () => {
  const [rows] = await pool.query(`
    SELECT MATAIKHOAN, TENDANGNHAP, HOTEN, CHUCVU, 
           CAST(TRANGTHAI AS UNSIGNED) AS TRANGTHAI
    FROM TAI_KHOAN
  `);
  // MySQL boolean có thể là tinyint(1), convert về true/false cho frontend
  return rows.map(r => ({ ...r, TRANGTHAI: !!r.TRANGTHAI }));
};

// === Kiểm tra username tồn tại ===
const isUsernameTaken = async (username) => {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS count FROM TAI_KHOAN WHERE TENDANGNHAP = ?',
    [username]
  );
  return rows[0].count > 0;
};

// === Tạo tài khoản mới ===
const createUser = async (username, hash, full_name, role, status = true) => {
  const [result] = await pool.query(
    'INSERT INTO TAI_KHOAN (TENDANGNHAP, MATKHAU, HOTEN, CHUCVU, TRANGTHAI) VALUES (?, ?, ?, ?, ?)',
    [username, hash, full_name || '', role || 'CAN_BO_NGHIEP_VU', status]
  );
  return result;
};

// === Cập nhật tài khoản ===
const updateUser = async (user_id, full_name, username, password, role, status) => {
  const [result] = await pool.query(
    'UPDATE TAI_KHOAN SET HOTEN = ?, TENDANGNHAP = ?, MATKHAU = ?, CHUCVU = ?, TRANGTHAI = ? WHERE MATAIKHOAN = ?',
    [full_name, username, password, role, status, user_id]
  );
  return result;
};

// === Xóa tài khoản ===
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
