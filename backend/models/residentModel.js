const pool = require('../db');

// ============================================
// 1. LẤY DANH SÁCH NHÂN KHẨU
// ============================================
const getAllResidents = async () => {
  const [rows] = await pool.query(`
    SELECT 
      nk.*,
      hk.DIACHI AS DIACHI_HK,
      hknk.SOHOKHAU,
      hknk.QUANHECHUHO,
      hknk.LA_CHU_HO,
      
      -- Lấy thông tin biến động gần nhất (nếu có)
      (SELECT ls.NOI_CHUYEN_DEN
       FROM LICH_SU_NHAN_KHAU ls
       WHERE ls.MANHANKHAU = nk.MANHANKHAU
       AND ls.LOAI_BIEN_DONG = 'ChuyenDi'
       ORDER BY ls.NGAY_BIEN_DONG DESC, ls.ID DESC
       LIMIT 1) AS NOICHUYEN,
       
      (SELECT ls.NGAY_BIEN_DONG
       FROM LICH_SU_NHAN_KHAU ls
       WHERE ls.MANHANKHAU = nk.MANHANKHAU
       AND ls.LOAI_BIEN_DONG IN ('ChuyenDi', 'QuaDoi')
       ORDER BY ls.NGAY_BIEN_DONG DESC, ls.ID DESC
       LIMIT 1) AS NGAYCHUYENDI,
       
      (SELECT ls.LYDO
       FROM LICH_SU_NHAN_KHAU ls
       WHERE ls.MANHANKHAU = nk.MANHANKHAU
       AND ls.LOAI_BIEN_DONG IN ('ChuyenDi', 'QuaDoi')
       ORDER BY ls.NGAY_BIEN_DONG DESC, ls.ID DESC
       LIMIT 1) AS GHICHU
       
    FROM NHAN_KHAU nk
    LEFT JOIN HO_KHAU_NHAN_KHAU hknk 
      ON nk.MANHANKHAU = hknk.MANHANKHAU 
      AND hknk.TRANGTHAI = 'DangO'
    LEFT JOIN HO_KHAU hk 
      ON hknk.SOHOKHAU = hk.SOHOKHAU
      AND hk.TRANGTHAI = 'HoatDong'
    ORDER BY nk.MANHANKHAU ASC
  `);
  return rows;
};

// ============================================
// 2. TÌM KIẾM NHÂN KHẨU
// ============================================
const searchResidents = async (query) => {
  const like = `%${String(query).trim()}%`;
  
  const [rows] = await pool.query(`
    SELECT 
      nk.*,
      hk.DIACHI AS DIACHI_HK,
      hknk.QUANHECHUHO,
      hknk.LA_CHU_HO,
      
      (SELECT ls.NOI_CHUYEN_DEN
       FROM LICH_SU_NHAN_KHAU ls
       WHERE ls.MANHANKHAU = nk.MANHANKHAU
       AND ls.LOAI_BIEN_DONG = 'ChuyenDi'
       ORDER BY ls.NGAY_BIEN_DONG DESC LIMIT 1) AS NOICHUYEN,
       
      (SELECT ls.NGAY_BIEN_DONG
       FROM LICH_SU_NHAN_KHAU ls
       WHERE ls.MANHANKHAU = nk.MANHANKHAU
       AND ls.LOAI_BIEN_DONG IN ('ChuyenDi', 'QuaDoi')
       ORDER BY ls.NGAY_BIEN_DONG DESC LIMIT 1) AS NGAYCHUYENDI,
       
      (SELECT ls.LYDO
       FROM LICH_SU_NHAN_KHAU ls
       WHERE ls.MANHANKHAU = nk.MANHANKHAU
       AND ls.LOAI_BIEN_DONG IN ('ChuyenDi', 'QuaDoi')
       ORDER BY ls.NGAY_BIEN_DONG DESC LIMIT 1) AS GHICHU
       
    FROM NHAN_KHAU nk
    LEFT JOIN HO_KHAU_NHAN_KHAU hknk 
      ON nk.MANHANKHAU = hknk.MANHANKHAU 
      AND hknk.TRANGTHAI = 'DangO'
    LEFT JOIN HO_KHAU hk 
      ON hknk.SOHOKHAU = hk.SOHOKHAU
      AND hk.TRANGTHAI = 'HoatDong'
    WHERE (nk.HOTEN LIKE ? OR nk.CCCD LIKE ?)
    ORDER BY nk.MANHANKHAU ASC
  `, [like, like]);
  
  return rows;
};

// ============================================
// 3. THÊM NHÂN KHẨU MỚI
// ============================================
const addResident = async (data, createdBy = null) => {
  const {
    hoten, bidanh, ngaysinh, gioitinh, noisinh, nguyenquan, dantoc, quoctich,
    cccd, noilamviec, nghenghiep, ngaycap, noicap, trangthai, noithuongtrucu,
    sohokhau, quanhechuho
  } = data;
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Thêm nhân khẩu
    const [result] = await connection.query(`
      INSERT INTO NHAN_KHAU (
        HOTEN, BIDANH, NGAYSINH, GIOITINH, NOISINH, NGUYENQUAN,
        DANTOC, QUOCTICH, CCCD, NOILAMVIEC, NGHENGHIEP, NGAYCAP_CCCD, NOICAP_CCCD,
        TRANGTHAI, NOITHUONGTRUCU, CREATED_BY
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      hoten, bidanh, ngaysinh, gioitinh, noisinh, nguyenquan,
      dantoc, quoctich, cccd, noilamviec, nghenghiep, ngaycap, noicap,
      trangthai, noithuongtrucu, createdBy
    ]);
    
    const manhankhau = result.insertId;
    
    // 2. Nếu có hộ khẩu, thêm vào bảng quan hệ
    if (sohokhau) {
      // Kiểm tra hộ khẩu tồn tại
      const [checkHK] = await connection.query(
        'SELECT SOHOKHAU FROM HO_KHAU WHERE SOHOKHAU = ? AND TRANGTHAI = "HoatDong"',
        [sohokhau]
      );
      
      if (checkHK.length === 0) {
        throw new Error('Hộ khẩu không tồn tại');
      }
      
      // Kiểm tra nếu là chủ hộ thì hộ chưa có chủ hộ
      const laChuHo = (quanhechuho === 'Chủ hộ');
      
      if (laChuHo) {
        const [checkChuHo] = await connection.query(`
          SELECT COUNT(*) as count
          FROM HO_KHAU_NHAN_KHAU
          WHERE SOHOKHAU = ? AND LA_CHU_HO = TRUE AND TRANGTHAI = 'DangO'
        `, [sohokhau]);
        
        if (checkChuHo[0].count > 0) {
          throw new Error('Hộ khẩu đã có chủ hộ');
        }
      }
      
      // Thêm vào bảng quan hệ
      await connection.query(`
        INSERT INTO HO_KHAU_NHAN_KHAU (
          SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO,
          NGAY_VAO_HO, TRANGTHAI
        ) VALUES (?, ?, ?, ?, CURDATE(), 'DangO')
      `, [sohokhau, manhankhau, quanhechuho, laChuHo]);
      
      // Ghi log
      await connection.query(`
        INSERT INTO LICH_SU_NHAN_KHAU (
          MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
          LYDO, NGUOI_THUC_HIEN
        ) VALUES (?, 'VaoHo', CURDATE(), ?, ?)
      `, [manhankhau, `Gia nhập hộ khẩu số ${sohokhau} với vai trò ${quanhechuho}`, createdBy]);
    } else {
      // Không thuộc hộ nào, chỉ ghi log tạo mới
      await connection.query(`
        INSERT INTO LICH_SU_NHAN_KHAU (
          MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
          LYDO, NGUOI_THUC_HIEN
        ) VALUES (?, 'TaoMoi', CURDATE(), 'Thêm nhân khẩu mới vào hệ thống', ?)
      `, [manhankhau, createdBy]);
    }
    
    await connection.commit();
    return { insertId: manhankhau };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================
// 4. CẬP NHẬT NHÂN KHẨU
// ============================================
const updateResident = async (id, updatedData, updatedBy = null) => {
  const fields = [];
  const values = [];
  
  const validFields = [
    'HOTEN', 'BIDANH', 'NGAYSINH', 'GIOITINH', 'NOISINH', 
    'NGUYENQUAN', 'DANTOC', 'QUOCTICH', 'CCCD', 'NOILAMVIEC', 
    'NGHENGHIEP', 'NGAYCAP_CCCD', 'NOICAP_CCCD', 'TRANGTHAI', 'NOITHUONGTRUCU'
  ];
  
  for (const key in updatedData) {
    if (validFields.includes(key.toUpperCase())) {
      fields.push(`${key.toUpperCase()} = ?`);
      values.push(updatedData[key]);
    }
  }
  
  if (fields.length === 0) {
    return { message: 'Không có trường hợp lệ để cập nhật' };
  }
  
  fields.push('UPDATED_BY = ?');
  fields.push('UPDATED_AT = NOW()');
  values.push(updatedBy);
  values.push(id);
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Lấy thông tin cũ
    const [oldData] = await connection.query(
      'SELECT * FROM NHAN_KHAU WHERE MANHANKHAU = ?',
      [id]
    );
    
    if (oldData.length === 0) {
      throw new Error('Nhân khẩu không tồn tại');
    }
    
    const old = oldData[0];
    
    // Cập nhật
    const [result] = await connection.query(`
      UPDATE NHAN_KHAU
      SET ${fields.join(', ')}
      WHERE MANHANKHAU = ?
    `, values);
    
    // Xử lý biến động đặc biệt
    if (result.affectedRows > 0) {
      const { TRANGTHAI, NOICHUYEN, GHICHU, NGAYCHUYENDI } = updatedData;
      
      // Ghi log cho trạng thái đặc biệt
      if (TRANGTHAI && TRANGTHAI !== old.TRANGTHAI) {
        let loaiBienDong = 'CapNhatThongTin';
        let noiChuyen = null;
        let lydo = `Thay đổi trạng thái từ ${old.TRANGTHAI} sang ${TRANGTHAI}`;
        
        if (TRANGTHAI === 'ChuyenDi') {
          loaiBienDong = 'ChuyenDi';
          noiChuyen = NOICHUYEN || 'Chưa xác định';
          lydo = `Chuyển đi: ${noiChuyen}`;
        } else if (TRANGTHAI === 'DaQuaDoi') {
          loaiBienDong = 'QuaDoi';
          lydo = GHICHU || 'Đã qua đời';
        } else if (TRANGTHAI === 'TamVang') {
          loaiBienDong = 'TamVang';
          noiChuyen = NOICHUYEN;
          lydo = `Tạm vắng: ${GHICHU || 'Chưa rõ lý do'}`;
        } else if (TRANGTHAI === 'VeThuongTru') {
          loaiBienDong = 'VeThuongTru';
          lydo = 'Trở về thường trú';
        }
        
        await connection.query(`
          INSERT INTO LICH_SU_NHAN_KHAU (
            MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
            NOI_CHUYEN_DEN, LYDO, NGUOI_THUC_HIEN
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          id,
          loaiBienDong,
          NGAYCHUYENDI || new Date(),
          noiChuyen,
          lydo,
          updatedBy
        ]);
      }
    }
    
    await connection.commit();
    return result;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================
// 5. XÓA NHÂN KHẨU
// ============================================
const deleteResident = async (id, deletedBy = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Kiểm tra nhân khẩu có phải chủ hộ không
    const [checkChuHo] = await connection.query(`
      SELECT hknk.SOHOKHAU
      FROM HO_KHAU_NHAN_KHAU hknk
      WHERE hknk.MANHANKHAU = ? 
      AND hknk.LA_CHU_HO = TRUE 
      AND hknk.TRANGTHAI = 'DangO'
    `, [id]);
    
    if (checkChuHo.length > 0) {
      throw new Error('Không thể xóa chủ hộ. Vui lòng đổi chủ hộ trước');
    }
    
    // Ghi log trước khi xóa
    await connection.query(`
      INSERT INTO LICH_SU_NHAN_KHAU (
        MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        LYDO, NGUOI_THUC_HIEN
      ) VALUES (?, 'Xoa', CURDATE(), 'Xóa nhân khẩu khỏi hệ thống', ?)
    `, [id, deletedBy]);
    
    // Xóa quan hệ hộ khẩu (nếu có)
    await connection.query(
      'DELETE FROM HO_KHAU_NHAN_KHAU WHERE MANHANKHAU = ?',
      [id]
    );
    
    // Xóa nhân khẩu
    const [result] = await connection.query(
      'DELETE FROM NHAN_KHAU WHERE MANHANKHAU = ?',
      [id]
    );
    
    await connection.commit();
    return result;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================
// 6. LẤY LỊCH SỬ BIẾN ĐỘNG
// ============================================
const getResidentHistory = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      ID,
      MANHANKHAU,
      LOAI_BIEN_DONG,
      NGAY_BIEN_DONG,
      NOI_CHUYEN_DEN,
      LYDO,
      DU_LIEU_CU,
      DU_LIEU_MOI,
      NGUOI_THUC_HIEN,
      CREATED_AT
    FROM LICH_SU_NHAN_KHAU
    WHERE MANHANKHAU = ?
    ORDER BY NGAY_BIEN_DONG DESC, ID DESC
  `, [id]);
  
  return rows;
};

// ============================================
// 7. THÊM NHÂN KHẨU VÀO HỘ
// ============================================
const addResidentToHousehold = async (manhankhau, sohokhau, quanhechuho, updatedBy = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Kiểm tra nhân khẩu đã thuộc hộ nào chưa
    const [check] = await connection.query(`
      SELECT SOHOKHAU FROM HO_KHAU_NHAN_KHAU
      WHERE MANHANKHAU = ? AND TRANGTHAI = 'DangO'
    `, [manhankhau]);
    
    if (check.length > 0) {
      throw new Error('Nhân khẩu đã thuộc hộ khẩu khác');
    }
    
    const laChuHo = (quanhechuho === 'Chủ hộ');
    
    // Nếu là chủ hộ, kiểm tra hộ đã có chủ hộ chưa
    if (laChuHo) {
      const [checkChuHo] = await connection.query(`
        SELECT COUNT(*) as count
        FROM HO_KHAU_NHAN_KHAU
        WHERE SOHOKHAU = ? AND LA_CHU_HO = TRUE AND TRANGTHAI = 'DangO'
      `, [sohokhau]);
      
      if (checkChuHo[0].count > 0) {
        throw new Error('Hộ khẩu đã có chủ hộ');
      }
    }
    
    // Thêm vào hộ
    await connection.query(`
      INSERT INTO HO_KHAU_NHAN_KHAU (
        SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO,
        NGAY_VAO_HO, TRANGTHAI
      ) VALUES (?, ?, ?, ?, CURDATE(), 'DangO')
    `, [sohokhau, manhankhau, quanhechuho, laChuHo]);
    
    // Ghi log
    await connection.query(`
      INSERT INTO LICH_SU_NHAN_KHAU (
        MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        LYDO, NGUOI_THUC_HIEN
      ) VALUES (?, 'VaoHo', CURDATE(), ?, ?)
    `, [
      manhankhau,
      `Gia nhập hộ khẩu số ${sohokhau} với vai trò ${quanhechuho}`,
      updatedBy
    ]);
    
    await connection.commit();
    return { success: true };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================
// 8. RỜI HỘ KHẨU
// ============================================
const removeResidentFromHousehold = async (manhankhau, sohokhau, lydo, updatedBy = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Kiểm tra có phải chủ hộ không
    const [checkChuHo] = await connection.query(`
      SELECT LA_CHU_HO FROM HO_KHAU_NHAN_KHAU
      WHERE MANHANKHAU = ? AND SOHOKHAU = ? AND TRANGTHAI = 'DangO'
    `, [manhankhau, sohokhau]);
    
    if (checkChuHo.length === 0) {
      throw new Error('Nhân khẩu không thuộc hộ khẩu này');
    }
    
    if (checkChuHo[0].LA_CHU_HO) {
      throw new Error('Không thể rời hộ khi còn là chủ hộ');
    }
    
    // Đánh dấu rời hộ
    await connection.query(`
      UPDATE HO_KHAU_NHAN_KHAU
      SET TRANGTHAI = 'DaRoi',
          NGAY_ROI_HO = CURDATE(),
          LYDO_ROI_HO = ?
      WHERE MANHANKHAU = ? AND SOHOKHAU = ?
    `, [lydo, manhankhau, sohokhau]);
    
    // Ghi log
    await connection.query(`
      INSERT INTO LICH_SU_NHAN_KHAU (
        MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        LYDO, NGUOI_THUC_HIEN
      ) VALUES (?, 'RoiHo', CURDATE(), ?, ?)
    `, [manhankhau, `Rời hộ khẩu số ${sohokhau}: ${lydo}`, updatedBy]);
    
    await connection.commit();
    return { success: true };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllResidents,
  searchResidents,
  addResident,
  updateResident,
  deleteResident,
  getResidentHistory,
  addResidentToHousehold,
  removeResidentFromHousehold
};