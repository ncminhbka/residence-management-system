const pool = require('../db');

// === Lấy danh sách nhân khẩu ===
const getAllResidents = async () => {
  const [rows] = await pool.query(`SELECT nk.*, hk.DIACHI AS DIACHI_HK
    FROM NHAN_KHAU nk
    LEFT JOIN HO_KHAU hk ON nk.SOHOKHAU = hk.SOHOKHAU
    WHERE hk.DELETE_FLAG = FALSE
    ORDER BY nk.MANHANKHAU ASC;`);
  return rows;
};

// === Tìm kiếm nhân khẩu theo tên hoặc CCCD ===
const searchResidents = async (query) => {
  const like = `%${String(query).trim()}%`;
  const [rows] = await pool.query(`SELECT nk.*, hk.DIACHI AS DIACHI_HK
    FROM NHAN_KHAU nk
    LEFT JOIN HO_KHAU hk ON nk.SOHOKHAU = hk.SOHOKHAU
    WHERE hk.DELETE_FLAG = FALSE
    AND (nk.HOTEN LIKE ? OR nk.SOCCCD LIKE ?)
    ORDER BY nk.MANHANKHAU ASC;`, [like, like]);
  return rows;
};

// === Thêm nhân khẩu mới ===
const addResident = async (data) => {
  const {
    hoten, bidanh, ngaysinh, gioitinh,
    noisinh, nguyenquan, dantoc, quoctich,
    nghenghiep, ngaycap, noicap,
    quanhechuho, trangthai, sohokhau, noithuongtrucu
  } = data;

  // Thêm vào bảng NHAN_KHAU
  const [result] = await pool.query(`
    INSERT INTO NHAN_KHAU (
      SOHOKHAU, HOTEN, BIDANH, NGAYSINH, GIOITINH,
      NOISINH, NGUYENQUAN, DANTOC, QUOCTICH,
      NGHENGHIEP, NGAYCAP, NOICAP, QUANHECHUHO, TRANGTHAI, NOITHUONGTRUCU
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    sohokhau, hoten, bidanh, ngaysinh, gioitinh,
    noisinh, nguyenquan, dantoc, quoctich,
    nghenghiep, ngaycap, noicap, quanhechuho, trangthai, noithuongtrucu
  ]);

  //  Ghi lại lịch sử thay đổi nhân khẩu
  await pool.query(`
    INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN)
    VALUES (?, 'Tạo mới', ?, ?)
  `, [result.insertId, new Date(), 'Thêm nhân khẩu mới']);

  return result;
};


// === Cập nhật nhân khẩu ===
const updateResident = async (id, updatedData) => {
  const fields = [];
  const values = [];

  // Chỉ cập nhật các cột hợp lệ trong NHAN_KHAU
  const validFields = [
    'SOHOKHAU', 'HOTEN', 'BIDANH', 'NGAYSINH', 'GIOITINH',
    'NOISINH', 'NGUYENQUAN', 'DANTOC', 'QUOCTICH',
    'NGHENGHIEP', 'NGAYCAP', 'NOICAP', 'QUANHECHUHO',
    'TRANGTHAI', 'NOITHUONGTRUCU'
  ];

  for (const key in updatedData) {
    if (validFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(updatedData[key]);
    }
  }

  if (fields.length === 0) return { message: 'Không có trường hợp lệ để cập nhật' };

  values.push(id);

  const [result] = await pool.query(`
    UPDATE NHAN_KHAU
    SET ${fields.join(', ')}
    WHERE MANHANKHAU = ?
  `, values);

  // Ghi lịch sử nếu có thay đổi
  if (result.changedRows > 0) {
    await pool.query(`
      INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN)
      VALUES (?, 'Cập nhật', ?, 'Cập nhật thông tin nhân khẩu')
    `, [id, new Date()]);
  }

  return result;
};


// === Xóa nhân khẩu (hard delete) ===
const deleteResident = async (id) => {
  const [result] = await pool.query(`
    DELETE FROM NHAN_KHAU
    WHERE MANHANKHAU = ?
  `, [id]);

  if (result.affectedRows > 0) {
    await pool.query(`
      INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN)
      VALUES (?, 'Xóa', ?, 'Xóa nhân khẩu khỏi hệ thống')
    `, [id, new Date()]);
  }

  return result;
};


// === Ghi nhận chuyển đi ===
const markMovedOut = async (id, noiChuyenDen, ngayChuyenDi) => {
  await pool.query(`
    UPDATE NHAN_KHAU
    SET TRANGTHAI = 'Đã chuyển đi'
    WHERE MANHANKHAU = ?
  `, [id]);

  await pool.query(`
    INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN)
    VALUES (?, 'Chuyển đi', ?, ?)
  `, [id, ngayChuyenDi, noiChuyenDen]);
};


// === Ghi nhận qua đời ===
const markDeceased = async (id, ngayMat) => {
  await pool.query(`
    UPDATE NHAN_KHAU
    SET TRANGTHAI = 'Đã mất'
    WHERE MANHANKHAU = ?
  `, [id]);

  await pool.query(`
    INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN)
    VALUES (?, 'Qua đời', ?, 'Ghi nhận nhân khẩu qua đời')
  `, [id, ngayMat]);
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
  deleteResident,
  markMovedOut,
  markDeceased,
  getResidentHistory
};
