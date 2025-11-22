const pool = require('../db');

// === Lấy danh sách nhân khẩu ===
const getAllResidents = async () => {
  const [rows] = await pool.query(`
    SELECT nk.*, hk.DIACHI AS DIACHI_HK
    FROM NHAN_KHAU nk
    LEFT JOIN HO_KHAU hk ON nk.SOHOKHAU = hk.SOHOKHAU
    WHERE hk.DELETE_FLAG = FALSE
    ORDER BY nk.MANHANKHAU ASC;
  `);
  return rows;
};

// === Tìm kiếm nhân khẩu theo tên ===
const searchResidents = async (query) => {
  const like = `%${String(query).trim()}%`;
  const [rows] = await pool.query(`
    SELECT nk.*, hk.DIACHI AS DIACHI_HK
    FROM NHAN_KHAU nk
    LEFT JOIN HO_KHAU hk ON nk.SOHOKHAU = hk.SOHOKHAU
    WHERE hk.DELETE_FLAG = FALSE
    AND (nk.HOTEN LIKE ? OR nk.CCCD LIKE ?) 
    ORDER BY nk.MANHANKHAU ASC;
  `, [like, like]);
  return rows;
};

// === Thêm nhân khẩu mới ===
const addResident = async (data) => {
  const {
    hoten, bidanh, ngaysinh, gioitinh,
    noisinh, nguyenquan, dantoc, quoctich,
    cccd, noilamviec,
    nghenghiep, ngaycap, noicap,
    quanhechuho, trangthai, sohokhau, noithuongtrucu
  } = data;

  const [result] = await pool.query(`
    INSERT INTO NHAN_KHAU (
      SOHOKHAU, HOTEN, BIDANH, NGAYSINH, GIOITINH,
      NOISINH, NGUYENQUAN, DANTOC, QUOCTICH,
      CCCD, NOILAMVIEC, 
      NGHENGHIEP, NGAYCAP, NOICAP, QUANHECHUHO, TRANGTHAI, NOITHUONGTRUCU
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    sohokhau, hoten, bidanh, ngaysinh, gioitinh,
    noisinh, nguyenquan, dantoc, quoctich,
    cccd, noilamviec,
    nghenghiep, ngaycap, noicap, quanhechuho, trangthai, noithuongtrucu
  ]);

  // Ghi log tạo mới
  await pool.query(`
    INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN)
    VALUES (?, 'Tạo mới', ?, ?)
  `, [result.insertId, new Date(), 'Thêm nhân khẩu mới']);

  return result;
};

// === Cập nhật nhân khẩu (Logic nâng cao) ===
const updateResident = async (id, updatedData) => {
  const fields = [];
  const values = [];

  // Danh sách các cột có thực trong bảng NHAN_KHAU
  const validFields = [
    'SOHOKHAU', 'HOTEN', 'BIDANH', 'NGAYSINH', 'GIOITINH',
    'NOISINH', 'NGUYENQUAN', 'DANTOC', 'QUOCTICH',
    'CCCD', 'NOILAMVIEC',
    'NGHENGHIEP', 'NGAYCAP', 'NOICAP', 'QUANHECHUHO',
    'TRANGTHAI', 'NOITHUONGTRUCU'
  ];

  for (const key in updatedData) {
    if (validFields.includes(key.toUpperCase())) {
      fields.push(`${key.toUpperCase()} = ?`);
      values.push(updatedData[key]);
    }
  }

  if (fields.length === 0) return { message: 'Không có trường hợp lệ để cập nhật' };

  values.push(id);

  // 1. Update bảng chính
  const [result] = await pool.query(`
    UPDATE NHAN_KHAU
    SET ${fields.join(', ')}
    WHERE MANHANKHAU = ?
  `, values);

  // 2. Ghi log biến động (Quan trọng)
  if (result.changedRows > 0) {
    let loaiThayDoi = 'Cập nhật';
    let noiDungLog = 'Cập nhật thông tin nhân khẩu';

    // Lấy các dữ liệu biến động từ Controller gửi xuống
    const { TRANGTHAI, NOICHUYEN, GHICHU, NGAYCHUYENDI } = updatedData;
    const ngayBienDong = NGAYCHUYENDI || new Date(); // Ưu tiên ngày người dùng nhập

    // Logic phân loại log
    if (TRANGTHAI === 'ChuyenDi') {
      loaiThayDoi = 'ChuyenDi';
      noiDungLog = NOICHUYEN || 'Chuyển đi nơi khác';
    } else if (TRANGTHAI === 'DaQuaDoi') {
      loaiThayDoi = 'Tu';
      noiDungLog = 'Đã qua đời';
    }

    // Insert vào bảng lịch sử
    // Lưu ý: Đảm bảo bảng THAY_DOI_NHAN_KHAU trong DB đã có cột GHICHU
    await pool.query(`
      INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN, GHICHU)
      VALUES (?, ?, ?, ?, ?)
    `, [id, loaiThayDoi, ngayBienDong, noiDungLog, GHICHU || '']);
  }

  return result;
};

// === Ghi nhận chuyển đi (Hàm phụ, ít dùng nếu đã có updateResident) ===
const markMovedOut = async (id, noiChuyenDen, ngayChuyenDi) => {
  await pool.query(`
    UPDATE NHAN_KHAU
    SET TRANGTHAI = 'ChuyenDi'
    WHERE MANHANKHAU = ?
  `, [id]);

  await pool.query(`
    INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN)
    VALUES (?, 'ChuyenDi', ?, ?)
  `, [id, ngayChuyenDi, noiChuyenDen]);
};

// === Ghi nhận qua đời (Hàm phụ) ===
const markDeceased = async (id, ngayMat) => {
  await pool.query(`
    UPDATE NHAN_KHAU
    SET TRANGTHAI = 'DaQuaDoi'
    WHERE MANHANKHAU = ?
  `, [id]);

  await pool.query(`
    INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN)
    VALUES (?, 'Tu', ?, 'Ghi nhận nhân khẩu qua đời')
  `, [id, ngayMat]);
};

// === Xóa nhân khẩu ===
const deleteResident = async (id) => {
  const [result] = await pool.query(`DELETE FROM NHAN_KHAU WHERE MANHANKHAU = ?`, [id]);
  return result;
};

// === Lấy lịch sử thay đổi nhân khẩu ===
const getResidentHistory = async (id) => {
  const [rows] = await pool.query(`
    SELECT *
    FROM THAY_DOI_NHAN_KHAU
    WHERE MANHANKHAU = ?
    ORDER BY NGAYTHAYDOI DESC
  `, [id]);
  return rows;
};

// === Xuất module ===
module.exports = {
  getAllResidents,
  searchResidents,
  addResident,
  updateResident,
  markMovedOut,
  markDeceased,
  getResidentHistory,
  deleteResident // Đừng quên export hàm này
};