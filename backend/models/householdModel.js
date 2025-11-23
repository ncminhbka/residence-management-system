const pool = require('../db');

// ============================================
// 1. LẤY DANH SÁCH HỘ KHẨU
// ============================================
const getAllHousehold = async () => {
  const [rows] = await pool.query(`
SELECT 
    hk.SOHOKHAU,
    ANY_VALUE(hk.DIACHI) AS DIACHI,
    ANY_VALUE(hk.HOSOSO) AS HOSOSO,
    ANY_VALUE(hk.SODANGKYSO) AS SODANGKYSO,
    ANY_VALUE(hk.TOSO) AS TOSO,
    ANY_VALUE(hk.NGAYCAP) AS NGAYCAP,
    ANY_VALUE(hk.TRANGTHAI) AS TRANGTHAI,

    -- Thông tin chủ hộ
    ANY_VALUE(chu_ho.MANHANKHAU) AS MACHUHO,
    ANY_VALUE(chu_ho.HOTEN) AS HOTENCHUHO,

    -- Số thành viên (vẫn tính đúng)
    COUNT(DISTINCT hknk.MANHANKHAU) AS SO_THANH_VIEN,

    ANY_VALUE(hk.CREATED_AT) AS CREATED_AT,
    ANY_VALUE(hk.UPDATED_AT) AS UPDATED_AT

FROM HO_KHAU hk
LEFT JOIN HO_KHAU_NHAN_KHAU hknk_chu 
    ON hk.SOHOKHAU = hknk_chu.SOHOKHAU 
    AND hknk_chu.LA_CHU_HO = TRUE 
    AND hknk_chu.TRANGTHAI = 'DangO'
LEFT JOIN NHAN_KHAU chu_ho 
    ON hknk_chu.MANHANKHAU = chu_ho.MANHANKHAU
LEFT JOIN HO_KHAU_NHAN_KHAU hknk 
    ON hk.SOHOKHAU = hknk.SOHOKHAU 
    AND hknk.TRANGTHAI = 'DangO'
WHERE hk.TRANGTHAI = 'HoatDong'
GROUP BY hk.SOHOKHAU
ORDER BY hk.SOHOKHAU ASC;
  `);
  return rows;
};

// ============================================
// 2. TÌM KIẾM HỘ KHẨU
// ============================================
const searchHouseholds = async (query) => {
  const q = String(query).trim();
  const like = `%${q}%`;
  
  const [rows] = await pool.query(`
    SELECT 
    hk.SOHOKHAU,
    ANY_VALUE(hk.DIACHI) AS DIACHI,
    ANY_VALUE(hk.HOSOSO) AS HOSOSO,
    ANY_VALUE(hk.SODANGKYSO) AS SODANGKYSO,
    ANY_VALUE(hk.TOSO) AS TOSO,
    ANY_VALUE(hk.NGAYCAP) AS NGAYCAP,

    ANY_VALUE(chu_ho.MANHANKHAU) AS MACHUHO,
    ANY_VALUE(chu_ho.HOTEN) AS HOTENCHUHO,

    COUNT(DISTINCT hknk.MANHANKHAU) AS SO_THANH_VIEN

FROM HO_KHAU hk
LEFT JOIN HO_KHAU_NHAN_KHAU hknk_chu 
    ON hk.SOHOKHAU = hknk_chu.SOHOKHAU 
    AND hknk_chu.LA_CHU_HO = TRUE 
    AND hknk_chu.TRANGTHAI = 'DangO'
LEFT JOIN NHAN_KHAU chu_ho 
    ON hknk_chu.MANHANKHAU = chu_ho.MANHANKHAU
LEFT JOIN HO_KHAU_NHAN_KHAU hknk 
    ON hk.SOHOKHAU = hknk.SOHOKHAU 
    AND hknk.TRANGTHAI = 'DangO'

WHERE hk.TRANGTHAI = 'HoatDong'
  AND (ANY_VALUE(chu_ho.HOTEN) LIKE ? OR hk.SOHOKHAU = ?)

GROUP BY hk.SOHOKHAU
ORDER BY hk.SOHOKHAU ASC;
  `, [like, q]);
  
  return rows;
};

// ============================================
// 3. KIỂM TRA NHÂN KHẨU ĐÃ LÀ CHỦ HỘ CHƯA
// ============================================
const isHoKhauTaken = async (maNhanKhau) => {
  const [rows] = await pool.query(`
    SELECT hk.SOHOKHAU
    FROM HO_KHAU hk
    JOIN HO_KHAU_NHAN_KHAU hknk 
      ON hk.SOHOKHAU = hknk.SOHOKHAU
    WHERE hknk.MANHANKHAU = ?
    AND hknk.LA_CHU_HO = TRUE
    AND hknk.TRANGTHAI = 'DangO'
    AND hk.TRANGTHAI = 'HoatDong'
  `, [maNhanKhau]);
  
  return rows.length > 0;
};

// ============================================
// 4. THÊM HỘ KHẨU MỚI
// ============================================
const addHouseholds = async (maChuHo, diachi, hososo, sodangkyso, toso, createdBy = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Kiểm tra nhân khẩu tồn tại
    const [checkNK] = await connection.query(
      'SELECT MANHANKHAU FROM NHAN_KHAU WHERE MANHANKHAU = ?',
      [maChuHo]
    );
    
    if (checkNK.length === 0) {
      throw new Error('Mã nhân khẩu không tồn tại');
    }
    
    // 2. Kiểm tra nhân khẩu đã thuộc hộ nào chưa
    const [checkHo] = await connection.query(`
      SELECT SOHOKHAU FROM HO_KHAU_NHAN_KHAU 
      WHERE MANHANKHAU = ? AND TRANGTHAI = 'DangO'
    `, [maChuHo]);
    
    if (checkHo.length > 0) {
      throw new Error('Nhân khẩu đã thuộc hộ khẩu khác');
    }
    
    // 3. Tạo hộ khẩu mới
    const [result] = await connection.query(`
      INSERT INTO HO_KHAU (
        DIACHI, HOSOSO, SODANGKYSO, TOSO, NGAYCAP, 
        TRANGTHAI, CREATED_BY
      ) VALUES (?, ?, ?, ?, CURDATE(), 'HoatDong', ?)
    `, [diachi, hososo, sodangkyso, toso, createdBy]);
    
    const sohokhau = result.insertId;
    
    // 4. Thêm chủ hộ vào bảng quan hệ
    await connection.query(`
      INSERT INTO HO_KHAU_NHAN_KHAU (
        SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO, 
        NGAY_VAO_HO, TRANGTHAI
      ) VALUES (?, ?, 'Chủ hộ', TRUE, CURDATE(), 'DangO')
    `, [sohokhau, maChuHo]);
    
    // 5. Ghi log
    await connection.query(`
      INSERT INTO LICH_SU_HO_KHAU (
        SOHOKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG, 
        MO_TA, NGUOI_THUC_HIEN
      ) VALUES (?, 'TaoMoi', CURDATE(), 'Tạo mới hộ khẩu', ?)
    `, [sohokhau, createdBy]);
    
    await connection.query(`
      INSERT INTO LICH_SU_NHAN_KHAU (
        MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        LYDO, NGUOI_THUC_HIEN
      ) VALUES (?, 'VaoHo', CURDATE(), ?, ?)
    `, [maChuHo, `Gia nhập hộ khẩu số ${sohokhau} với vai trò Chủ hộ`, createdBy]);
    
    await connection.commit();
    return { insertId: sohokhau };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================
// 5. XÓA HỘ KHẨU (SOFT DELETE)
// ============================================
const deleteHouseholds = async (sohokhau, deletedBy = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Kiểm tra hộ khẩu tồn tại
    const [checkHK] = await connection.query(
      'SELECT SOHOKHAU FROM HO_KHAU WHERE SOHOKHAU = ? AND TRANGTHAI = "HoatDong"',
      [sohokhau]
    );
    
    if (checkHK.length === 0) {
      throw new Error('Hộ khẩu không tồn tại hoặc đã bị xóa');
    }
    
    // 2. Đánh dấu tất cả thành viên rời hộ
    await connection.query(`
      UPDATE HO_KHAU_NHAN_KHAU
      SET TRANGTHAI = 'DaRoi',
          NGAY_ROI_HO = CURDATE(),
          LYDO_ROI_HO = 'Giải tán hộ khẩu'
      WHERE SOHOKHAU = ? AND TRANGTHAI = 'DangO'
    `, [sohokhau]);
    
    // 3. Đổi trạng thái hộ khẩu
    await connection.query(`
      UPDATE HO_KHAU
      SET TRANGTHAI = 'DaGiai',
          UPDATED_BY = ?,
          UPDATED_AT = NOW()
      WHERE SOHOKHAU = ?
    `, [deletedBy, sohokhau]);
    
    // 4. Ghi log
    await connection.query(`
      INSERT INTO LICH_SU_HO_KHAU (
        SOHOKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        MO_TA, NGUOI_THUC_HIEN
      ) VALUES (?, 'GiaiHo', CURDATE(), 'Giải tán hộ khẩu', ?)
    `, [sohokhau, deletedBy]);
    
    await connection.commit();
    return { affectedRows: 1 };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================
// 6. CẬP NHẬT HỘ KHẨU
// ============================================
const updateHouseholds = async (sohokhau, updateData, updatedBy = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { diachi, hososo, sodangkyso, toso } = updateData;
    
    // Lấy thông tin cũ
    const [old] = await connection.query(
      'SELECT * FROM HO_KHAU WHERE SOHOKHAU = ?',
      [sohokhau]
    );
    
    if (old.length === 0) {
      throw new Error('Hộ khẩu không tồn tại');
    }
    
    const oldData = old[0];
    let changes = [];
    
    // Cập nhật
    const [result] = await connection.query(`
      UPDATE HO_KHAU
      SET DIACHI = ?, HOSOSO = ?, SODANGKYSO = ?, TOSO = ?,
          UPDATED_BY = ?, UPDATED_AT = NOW()
      WHERE SOHOKHAU = ?
    `, [diachi, hososo, sodangkyso, toso, updatedBy, sohokhau]);
    
    // Ghi log thay đổi
    if (result.changedRows > 0) {
      if (oldData.DIACHI !== diachi)
        changes.push(`Địa chỉ: '${oldData.DIACHI}' → '${diachi}'`);
      if (oldData.HOSOSO !== hososo)
        changes.push(`Hồ sơ số: ${oldData.HOSOSO} → ${hososo}`);
      if (oldData.SODANGKYSO !== sodangkyso)
        changes.push(`Sổ đăng ký số: ${oldData.SODANGKYSO} → ${sodangkyso}`);
      if (oldData.TOSO !== toso)
        changes.push(`Tổ số: ${oldData.TOSO} → ${toso}`);
      
      if (changes.length > 0) {
        await connection.query(`
          INSERT INTO LICH_SU_HO_KHAU (
            SOHOKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
            MO_TA, NGUOI_THUC_HIEN
          ) VALUES (?, 'CapNhatThongTin', CURDATE(), ?, ?)
        `, [sohokhau, changes.join('; '), updatedBy]);
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
// 7. ĐỔI CHỦ HỘ (MỚI)
// ============================================
const changeHouseholdOwner = async (sohokhau, newOwnerId, updatedBy = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Lấy thông tin chủ hộ cũ
    const [oldOwner] = await connection.query(`
      SELECT hknk.MANHANKHAU, nk.HOTEN
      FROM HO_KHAU_NHAN_KHAU hknk
      JOIN NHAN_KHAU nk ON hknk.MANHANKHAU = nk.MANHANKHAU
      WHERE hknk.SOHOKHAU = ? 
      AND hknk.LA_CHU_HO = TRUE 
      AND hknk.TRANGTHAI = 'DangO'
    `, [sohokhau]);
    
    if (oldOwner.length === 0) {
      throw new Error('Không tìm thấy chủ hộ hiện tại');
    }
    
    const oldOwnerId = oldOwner[0].MANHANKHAU;
    const oldOwnerName = oldOwner[0].HOTEN;
    
    // 2. Kiểm tra chủ hộ mới có trong hộ không
    const [newOwner] = await connection.query(`
      SELECT hknk.MANHANKHAU, nk.HOTEN
      FROM HO_KHAU_NHAN_KHAU hknk
      JOIN NHAN_KHAU nk ON hknk.MANHANKHAU = nk.MANHANKHAU
      WHERE hknk.SOHOKHAU = ? 
      AND hknk.MANHANKHAU = ?
      AND hknk.TRANGTHAI = 'DangO'
    `, [sohokhau, newOwnerId]);
    
    if (newOwner.length === 0) {
      throw new Error('Chủ hộ mới không thuộc hộ khẩu này');
    }
    
    const newOwnerName = newOwner[0].HOTEN;
    
    // 3. Bỏ cờ chủ hộ của người cũ
    await connection.query(`
      UPDATE HO_KHAU_NHAN_KHAU
      SET LA_CHU_HO = FALSE,
          QUANHECHUHO = 'NULL'
      WHERE SOHOKHAU = ? AND MANHANKHAU = ?
    `, [sohokhau, oldOwnerId]);
    
    // 4. Đặt cờ chủ hộ cho người mới
    await connection.query(`
      UPDATE HO_KHAU_NHAN_KHAU
      SET LA_CHU_HO = TRUE,
          QUANHECHUHO = 'Chủ hộ'
      WHERE SOHOKHAU = ? AND MANHANKHAU = ?
    `, [sohokhau, newOwnerId]);
    
    // 5. Ghi log
    await connection.query(`
      INSERT INTO LICH_SU_HO_KHAU (
        SOHOKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        MO_TA, NGUOI_THUC_HIEN
      ) VALUES (?, 'DoiChuHo', CURDATE(), ?, ?)
    `, [
      sohokhau, 
      `Đổi chủ hộ: ${oldOwnerName} (${oldOwnerId}) → ${newOwnerName} (${newOwnerId})`,
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
// 8. THAY ĐỔI QUAN HỆ VỚI CHỦ HỘ (MỚI)
// ============================================
const updateMemberRelation = async (sohokhau, memberId, newRelation, updatedBy = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Không cho đổi quan hệ của chủ hộ
    const [check] = await connection.query(`
      SELECT LA_CHU_HO FROM HO_KHAU_NHAN_KHAU
      WHERE SOHOKHAU = ? AND MANHANKHAU = ? AND TRANGTHAI = 'DangO'
    `, [sohokhau, memberId]);
    
    if (check.length === 0) {
      throw new Error('Thành viên không thuộc hộ khẩu này');
    }
    
    if (check[0].LA_CHU_HO) {
      throw new Error('Không thể thay đổi quan hệ của chủ hộ');
    }
    
    // Cập nhật quan hệ
    const [result] = await connection.query(`
      UPDATE HO_KHAU_NHAN_KHAU
      SET QUANHECHUHO = ?
      WHERE SOHOKHAU = ? AND MANHANKHAU = ?
    `, [newRelation, sohokhau, memberId]);
    
    // Ghi log
    await connection.query(`
      INSERT INTO LICH_SU_HO_KHAU (
        SOHOKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        MO_TA, NGUOI_THUC_HIEN
      ) VALUES (?, 'CapNhatThongTin', CURDATE(), ?, ?)
    `, [
      sohokhau,
      `Thay đổi quan hệ thành viên ${memberId} thành: ${newRelation}`,
      updatedBy
    ]);
    
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
// 9. LẤY CHI TIẾT HỘ KHẨU
// ============================================
const getHouseholdDetails = async (sohokhau) => {
  const [rows] = await pool.query(`
    SELECT 
      nk.*,
      hknk.QUANHECHUHO,
      hknk.LA_CHU_HO,
      hknk.NGAY_VAO_HO
    FROM HO_KHAU_NHAN_KHAU hknk
    JOIN NHAN_KHAU nk ON hknk.MANHANKHAU = nk.MANHANKHAU
    WHERE hknk.SOHOKHAU = ? AND hknk.TRANGTHAI = 'DangO'
    ORDER BY hknk.LA_CHU_HO DESC, nk.NGAYSINH ASC
  `, [sohokhau]);
  
  return rows;
};

// ============================================
// 10. TÁCH HỘ 
// ============================================
const splitHousehold = async (sohokhauGoc, thongTinHoMoi, thanhVienChuyenDi, updatedBy = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { machuho, diachi, hososo, sodangkyso, toso, quanheThanhVien } = thongTinHoMoi;
    
    // 1. Kiểm tra chủ hộ mới có trong danh sách chuyển không
    if (!thanhVienChuyenDi.includes(machuho)) {
      throw new Error('Chủ hộ mới phải nằm trong danh sách thành viên chuyển đi');
    }
    
    // 2. Kiểm tra các thành viên có thuộc hộ gốc không
    const [checkMembers] = await connection.query(`
      SELECT COUNT(*) as count
      FROM HO_KHAU_NHAN_KHAU
      WHERE SOHOKHAU = ? 
      AND MANHANKHAU IN (?)
      AND TRANGTHAI = 'DangO'
    `, [sohokhauGoc, thanhVienChuyenDi]);
    
    if (checkMembers[0].count !== thanhVienChuyenDi.length) {
      throw new Error('Có thành viên không thuộc hộ khẩu gốc');
    }
    
    // 3. Tạo hộ khẩu mới
    const [newHK] = await connection.query(`
      INSERT INTO HO_KHAU (
        DIACHI, HOSOSO, SODANGKYSO, TOSO, NGAYCAP,
        TRANGTHAI, CREATED_BY
      ) VALUES (?, ?, ?, ?, CURDATE(), 'HoatDong', ?)
    `, [diachi, hososo, sodangkyso, toso, updatedBy]);
    
    const sohokhauMoi = newHK.insertId;
    
    // 4. Đánh dấu thành viên rời hộ cũ
    await connection.query(`
      UPDATE HO_KHAU_NHAN_KHAU
      SET TRANGTHAI = 'DaRoi',
          NGAY_ROI_HO = CURDATE(),
          LYDO_ROI_HO = 'Tách hộ'
      WHERE SOHOKHAU = ? 
      AND MANHANKHAU IN (?)
    `, [sohokhauGoc, thanhVienChuyenDi]);
    
    // 5. Thêm thành viên vào hộ mới
    for (const memberId of thanhVienChuyenDi) {
      const laChuHo = (memberId === machuho);
      const quanHe = laChuHo ? 'Chủ hộ' : (quanheThanhVien[memberId] || null);
      
      await connection.query(`
        INSERT INTO HO_KHAU_NHAN_KHAU (
          SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO,
          NGAY_VAO_HO, TRANGTHAI
        ) VALUES (?, ?, ?, ?, CURDATE(), 'DangO')
      `, [sohokhauMoi, memberId, quanHe, laChuHo]);
      
      // Ghi log cho nhân khẩu
      await connection.query(`
        INSERT INTO LICH_SU_NHAN_KHAU (
          MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
          LYDO, NGUOI_THUC_HIEN
        ) VALUES (?, 'VaoHo', CURDATE(), ?, ?)
      `, [
        memberId,
        `Tách từ hộ ${sohokhauGoc} sang hộ ${sohokhauMoi} với vai trò ${quanHe || 'Thành viên'}`,
        updatedBy
      ]);
    }
    
    // 6. Ghi log hộ khẩu
    await connection.query(`
      INSERT INTO LICH_SU_HO_KHAU (
        SOHOKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        MO_TA, NGUOI_THUC_HIEN
      ) VALUES (?, 'TachHo', CURDATE(), ?, ?)
    `, [sohokhauGoc, `Tách hộ tạo hộ mới số ${sohokhauMoi}`, updatedBy]);
    
    await connection.query(`
      INSERT INTO LICH_SU_HO_KHAU (
        SOHOKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        MO_TA, NGUOI_THUC_HIEN
      ) VALUES (?, 'TaoMoi', CURDATE(), ?, ?)
    `, [sohokhauMoi, `Tách từ hộ số ${sohokhauGoc}`, updatedBy]);
    
    await connection.commit();
    return { insertId: sohokhauMoi };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================
// 11. THÊM THÀNH VIÊN VÀO HỘ KHẨU (MỚI)
// ============================================
const addMemberToHousehold = async (sohokhau, manhankhau, quanhechuho, updatedBy = null) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Kiểm tra hộ khẩu tồn tại
    const [checkHK] = await connection.query(
      'SELECT SOHOKHAU FROM HO_KHAU WHERE SOHOKHAU = ? AND TRANGTHAI = "HoatDong"',
      [sohokhau]
    );
    
    if (checkHK.length === 0) {
      throw new Error('Hộ khẩu không tồn tại');
    }
    
    // 2. Kiểm tra nhân khẩu tồn tại
    const [checkNK] = await connection.query(
      'SELECT MANHANKHAU FROM NHAN_KHAU WHERE MANHANKHAU = ?',
      [manhankhau]
    );
    
    if (checkNK.length === 0) {
      throw new Error('Nhân khẩu không tồn tại');
    }
    
    // 3. Kiểm tra nhân khẩu đã thuộc hộ nào chưa
    const [checkThuocHo] = await connection.query(`
      SELECT SOHOKHAU FROM HO_KHAU_NHAN_KHAU
      WHERE MANHANKHAU = ? AND TRANGTHAI = 'DangO'
    `, [manhankhau]);
    
    if (checkThuocHo.length > 0) {
      throw new Error('Nhân khẩu đã thuộc hộ khẩu khác');
    }
    
    // 4. Xác định có phải chủ hộ không
    const laChuHo = (quanhechuho === 'Chủ hộ');
    
    // 5. Nếu là chủ hộ, kiểm tra hộ đã có chủ hộ chưa
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
    
    // 6. Thêm vào hộ
    await connection.query(`
      INSERT INTO HO_KHAU_NHAN_KHAU (
        SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO,
        NGAY_VAO_HO, TRANGTHAI
      ) VALUES (?, ?, ?, ?, CURDATE(), 'DangO')
    `, [sohokhau, manhankhau, quanhechuho, laChuHo]);
    
    // 7. Ghi log cho hộ khẩu
    await connection.query(`
      INSERT INTO LICH_SU_HO_KHAU (
        SOHOKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        MO_TA, NGUOI_THUC_HIEN
      ) VALUES (?, 'ThemThanhVien', CURDATE(), ?, ?)
    `, [sohokhau, `Thêm nhân khẩu ${manhankhau} với vai trò ${quanhechuho}`, updatedBy]);
    
    // 8. Ghi log cho nhân khẩu
    await connection.query(`
      INSERT INTO LICH_SU_NHAN_KHAU (
        MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        LYDO, NGUOI_THUC_HIEN
      ) VALUES (?, 'VaoHo', CURDATE(), ?, ?)
    `, [manhankhau, `Gia nhập hộ khẩu số ${sohokhau} với vai trò ${quanhechuho}`, updatedBy]);
    
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
  getAllHousehold,
  searchHouseholds,
  isHoKhauTaken,
  addHouseholds,
  deleteHouseholds,
  updateHouseholds,
  changeHouseholdOwner,      // MỚI
  updateMemberRelation,       // MỚI
  getHouseholdDetails,
  splitHousehold,
  addMemberToHousehold        // MỚI
};