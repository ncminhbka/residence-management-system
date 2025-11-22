const pool = require('../db');

// === Lấy danh sách nhân khẩu (Kèm thông tin biến động) ===
const getAllResidents = async () => {
  const [rows] = await pool.query(`
    SELECT 
      nk.*, 
      hk.DIACHI AS DIACHI_HK,
      (SELECT t.NOICHUYEN 
       FROM THAY_DOI_NHAN_KHAU t 
       WHERE t.MANHANKHAU = nk.MANHANKHAU AND t.LOAITHAYDOI = 'ChuyenDi' 
       ORDER BY t.NGAYTHAYDOI DESC, t.MATDNK DESC LIMIT 1) AS NOICHUYEN,
      (SELECT t.NGAYTHAYDOI 
       FROM THAY_DOI_NHAN_KHAU t 
       WHERE t.MANHANKHAU = nk.MANHANKHAU AND t.LOAITHAYDOI IN ('ChuyenDi', 'Tu') 
       ORDER BY t.NGAYTHAYDOI DESC, t.MATDNK DESC LIMIT 1) AS NGAYCHUYENDI,
      (SELECT t.GHICHU 
       FROM THAY_DOI_NHAN_KHAU t 
       WHERE t.MANHANKHAU = nk.MANHANKHAU AND t.LOAITHAYDOI IN ('ChuyenDi', 'Tu') 
       ORDER BY t.NGAYTHAYDOI DESC, t.MATDNK DESC LIMIT 1) AS GHICHU
    FROM NHAN_KHAU nk
    LEFT JOIN HO_KHAU hk ON nk.SOHOKHAU = hk.SOHOKHAU
    WHERE hk.DELETE_FLAG = FALSE
    ORDER BY nk.MANHANKHAU ASC;
  `);
  return rows;
};

const searchResidents = async (query) => {
  const like = `%${String(query).trim()}%`;
  const [rows] = await pool.query(`
    SELECT 
      nk.*, 
      hk.DIACHI AS DIACHI_HK,
      (SELECT t.NOICHUYEN 
       FROM THAY_DOI_NHAN_KHAU t 
       WHERE t.MANHANKHAU = nk.MANHANKHAU AND t.LOAITHAYDOI = 'ChuyenDi' 
       ORDER BY t.NGAYTHAYDOI DESC LIMIT 1) AS NOICHUYEN,
      (SELECT t.NGAYTHAYDOI 
       FROM THAY_DOI_NHAN_KHAU t 
       WHERE t.MANHANKHAU = nk.MANHANKHAU AND t.LOAITHAYDOI IN ('ChuyenDi', 'Tu') 
       ORDER BY t.NGAYTHAYDOI DESC LIMIT 1) AS NGAYCHUYENDI,
      (SELECT t.GHICHU 
       FROM THAY_DOI_NHAN_KHAU t 
       WHERE t.MANHANKHAU = nk.MANHANKHAU AND t.LOAITHAYDOI IN ('ChuyenDi', 'Tu') 
       ORDER BY t.NGAYTHAYDOI DESC LIMIT 1) AS GHICHU
    FROM NHAN_KHAU nk
    LEFT JOIN HO_KHAU hk ON nk.SOHOKHAU = hk.SOHOKHAU
    WHERE hk.DELETE_FLAG = FALSE
    AND (nk.HOTEN LIKE ? OR nk.CCCD LIKE ?) 
    ORDER BY nk.MANHANKHAU ASC;
  `, [like, like]);
  return rows;
};

const addResident = async (data) => {
  const {
    hoten, bidanh, ngaysinh, gioitinh, noisinh, nguyenquan, dantoc, quoctich,
    cccd, noilamviec, nghenghiep, ngaycap, noicap, quanhechuho, trangthai, sohokhau, noithuongtrucu
  } = data;

  const [result] = await pool.query(`
    INSERT INTO NHAN_KHAU (
      SOHOKHAU, HOTEN, BIDANH, NGAYSINH, GIOITINH, NOISINH, NGUYENQUAN, DANTOC, QUOCTICH,
      CCCD, NOILAMVIEC, NGHENGHIEP, NGAYCAP, NOICAP, QUANHECHUHO, TRANGTHAI, NOITHUONGTRUCU
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    sohokhau, hoten, bidanh, ngaysinh, gioitinh, noisinh, nguyenquan, dantoc, quoctich,
    cccd, noilamviec, nghenghiep, ngaycap, noicap, quanhechuho, trangthai, noithuongtrucu
  ]);

  await pool.query(`
    INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN, GHICHU)
    VALUES (?, 'TaoMoi', ?, ?, ?)
  `, [result.insertId, new Date(), 'Thêm nhân khẩu mới', '']);

  return result;
};

// === [ĐÃ SỬA] Cập nhật nhân khẩu ===
const updateResident = async (id, updatedData) => {
  const fields = [];
  const values = [];
  const validFields = [
    'SOHOKHAU', 'HOTEN', 'BIDANH', 'NGAYSINH', 'GIOITINH', 'NOISINH', 'NGUYENQUAN', 'DANTOC', 'QUOCTICH',
    'CCCD', 'NOILAMVIEC', 'NGHENGHIEP', 'NGAYCAP', 'NOICAP', 'QUANHECHUHO', 'TRANGTHAI', 'NOITHUONGTRUCU'
  ];

  for (const key in updatedData) {
    if (validFields.includes(key.toUpperCase())) {
      fields.push(`${key.toUpperCase()} = ?`);
      values.push(updatedData[key]);
    }
  }

  if (fields.length === 0) return { message: 'Không có trường hợp lệ để cập nhật' };

  values.push(id);

  // 1. Cập nhật bảng chính NHAN_KHAU
  const [result] = await pool.query(`
    UPDATE NHAN_KHAU
    SET ${fields.join(', ')}
    WHERE MANHANKHAU = ?
  `, values);

  // 2. Ghi log vào bảng lịch sử
  // [QUAN TRỌNG]: Dùng affectedRows thay vì changedRows để đảm bảo luôn chạy kể cả khi chỉ sửa thông tin phụ
  if (result.affectedRows > 0) {

    // Lấy dữ liệu biến động
    const { TRANGTHAI, NOICHUYEN, GHICHU, NGAYCHUYENDI } = updatedData;

    // Chỉ ghi log nếu đây là trạng thái biến động (ChuyenDi hoặc DaQuaDoi)
    // Hoặc nếu người dùng có gửi thông tin biến động lên (để sửa lại log cũ)
    if (['ChuyenDi', 'DaQuaDoi'].includes(TRANGTHAI)) {

      let loaiThayDoi = 'CapNhat';
      let noiDungLog = 'Cập nhật thông tin'; // Default cho NOICHUYEN nếu null
      const ngayBienDong = NGAYCHUYENDI || new Date();

      if (TRANGTHAI === 'ChuyenDi') {
        loaiThayDoi = 'ChuyenDi';
        noiDungLog = NOICHUYEN || 'Chuyển đi nơi khác';
      } else if (TRANGTHAI === 'DaQuaDoi') {
        loaiThayDoi = 'Tu';
        noiDungLog = 'Đã qua đời';
      }

      // Insert log mới nhất (Cái này sẽ được ưu tiên hiển thị khi Select order by DESC limit 1)
      await pool.query(`
          INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NGAYTHAYDOI, NOICHUYEN, GHICHU)
          VALUES (?, ?, ?, ?, ?)
        `, [id, loaiThayDoi, ngayBienDong, noiDungLog, GHICHU || '']);
    }
  }

  return result;
};

const deleteResident = async (id) => {
  const [result] = await pool.query(`DELETE FROM NHAN_KHAU WHERE MANHANKHAU = ?`, [id]);
  return result;
};

const getResidentHistory = async (id) => {
  const [rows] = await pool.query(`
    SELECT * FROM THAY_DOI_NHAN_KHAU WHERE MANHANKHAU = ? ORDER BY NGAYTHAYDOI DESC
  `, [id]);
  return rows;
};

const markMovedOut = async (id, noiChuyenDen, ngayChuyenDi) => { };
const markDeceased = async (id, ngayMat) => { };

module.exports = {
  getAllResidents,
  searchResidents,
  addResident,
  updateResident,
  deleteResident,
  getResidentHistory,
  markMovedOut,
  markDeceased
};