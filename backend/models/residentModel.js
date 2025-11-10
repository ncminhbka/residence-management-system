const pool = require('../db');

// === Lấy danh sách nhân khẩu ===
const getAllResidents = async () => {
    const [rows] = await pool.query(`
    SELECT nk.*, hk.DIACHI AS DIACHI_HK
    FROM NHAN_KHAU nk
    LEFT JOIN HO_KHAU hk ON nk.SOHOKHAU = hk.SOHOKHAU
    WHERE nk.DELETE_FLAG = FALSE
    ORDER BY nk.MANHANKHAU ASC;
  `);
    return rows;
};

// === Tìm kiếm nhân khẩu theo tên hoặc CCCD ===
const searchResidents = async (query) => {
    const like = `%${String(query).trim()}%`;
    const [rows] = await pool.query(`
    SELECT nk.*, hk.DIACHI AS DIACHI_HK
    FROM NHAN_KHAU nk
    LEFT JOIN HO_KHAU hk ON nk.SOHOKHAU = hk.SOHOKHAU
    WHERE nk.DELETE_FLAG = FALSE
    AND (nk.HOTEN LIKE ? OR nk.SOCCCD LIKE ?)
  `, [like, like]);
    return rows;
};

// === Thêm nhân khẩu mới ===
const addResident = async (data) => {
    const {
        hoten, ngaysinh, gioitinh, socccd, ngaycap, noicap,
        sohokhau, quanhechuho, diachi, nghenghiep, trangthai, ghichu
    } = data;

    const [result] = await pool.query(`
    INSERT INTO NHAN_KHAU
    (HOTEN, NGAYSINH, GIOITINH, SOCCCD, NGAYCAP, NOICAP,
     SOHOKHAU, QUANHECHUHO, DIACHI, NGHENGHIEP, TRANGTHAI, GHICHU)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
        hoten, ngaysinh, gioitinh, socccd, ngaycap, noicap,
        sohokhau, quanhechuho, diachi, nghenghiep, trangthai, ghichu
    ]);

    // thêm lịch sử
    await pool.query(`
    INSERT INTO BIEN_DONG_NHAN_KHAU (MANHANKHAU, LOAI, THOIGIAN, NOIDUNG)
    VALUES (?, 'tao_moi', ?, ?)
  `, [result.insertId, new Date(), 'Thêm nhân khẩu mới']);

    return result;
};

// === Cập nhật nhân khẩu ===
const updateResident = async (id, updatedData) => {
    const fields = [];
    const values = [];

    for (const key in updatedData) {
        fields.push(`${key} = ?`);
        values.push(updatedData[key]);
    }

    values.push(id);

    const [result] = await pool.query(`
    UPDATE NHAN_KHAU SET ${fields.join(', ')} WHERE MANHANKHAU = ?
  `, values);

    if (result.changedRows > 0) {
        await pool.query(`
      INSERT INTO BIEN_DONG_NHAN_KHAU (MANHANKHAU, LOAI, THOIGIAN, NOIDUNG)
      VALUES (?, 'cap_nhat', ?, ?)
    `, [id, new Date(), 'Cập nhật thông tin nhân khẩu']);
    }

    return result;
};

// === Xóa nhân khẩu (không xóa thật, chỉ đánh cờ DELETE_FLAG) ===
const deleteResident = async (id) => {
    const [result] = await pool.query(`
    UPDATE NHAN_KHAU 
    SET DELETE_FLAG = TRUE 
    WHERE MANHANKHAU = ?
  `, [id]);

    if (result.changedRows > 0) {
        await pool.query(`
      INSERT INTO BIEN_DONG_NHAN_KHAU (MANHANKHAU, LOAI, THOIGIAN, NOIDUNG)
      VALUES (?, 'xoa', ?, ?)
    `, [id, new Date(), 'Xóa nhân khẩu']);
    }

    return result;
};

// === Ghi nhận chuyển đi ===
const markMovedOut = async (id, noiChuyenDen, ngayChuyenDi) => {
    await pool.query(`
    UPDATE NHAN_KHAU SET TRANGTHAI = 'da_chuyen_di', NOICHUYENDEN = ?, NGAYCHUYENDI = ?
    WHERE MANHANKHAU = ?
  `, [noiChuyenDen, ngayChuyenDi, id]);

    await pool.query(`
    INSERT INTO BIEN_DONG_NHAN_KHAU (MANHANKHAU, LOAI, THOIGIAN, NOIDUNG)
    VALUES (?, 'chuyen_di', ?, ?)
  `, [id, new Date(), `Chuyển đi: ${noiChuyenDen}`]);
};

// === Ghi nhận qua đời ===
const markDeceased = async (id, ngayMat) => {
    await pool.query(`
    UPDATE NHAN_KHAU SET TRANGTHAI = 'da_mat', NGAYMAT = ? WHERE MANHANKHAU = ?
  `, [ngayMat, id]);

    await pool.query(`
    INSERT INTO BIEN_DONG_NHAN_KHAU (MANHANKHAU, LOAI, THOIGIAN, NOIDUNG)
    VALUES (?, 'qua_doi', ?, ?)
  `, [id, new Date(), 'Ghi nhận qua đời']);
};

// === Lấy lịch sử biến động ===
const getResidentHistory = async (id) => {
    const [rows] = await pool.query(`
    SELECT * FROM BIEN_DONG_NHAN_KHAU
    WHERE MANHANKHAU = ?
    ORDER BY THOIGIAN DESC
  `, [id]);
    return rows;
};

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
