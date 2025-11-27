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
      const [checkHK] = await connection.query(
        'SELECT SOHOKHAU FROM HO_KHAU WHERE SOHOKHAU = ? AND TRANGTHAI = "HoatDong"',
        [sohokhau]
      );

      if (checkHK.length === 0) {
        throw new Error('Hộ khẩu không tồn tại');
      }

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

      await connection.query(`
        INSERT INTO HO_KHAU_NHAN_KHAU (
          SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO,
          NGAY_VAO_HO, TRANGTHAI
        ) VALUES (?, ?, ?, ?, CURDATE(), 'DangO')
      `, [sohokhau, manhankhau, quanhechuho, laChuHo]);

      await connection.query(`
        INSERT INTO LICH_SU_NHAN_KHAU (
          MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
          LYDO, NGUOI_THUC_HIEN
        ) VALUES (?, 'VaoHo', CURDATE(), ?, ?)
      `, [manhankhau, `Gia nhập hộ khẩu số ${sohokhau} với vai trò ${quanhechuho}`, createdBy]);
    } else {
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
// 4. CẬP NHẬT NHÂN KHẨU (✅ ĐÃ SỬA)
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

    // Cập nhật bảng NHAN_KHAU
    const [result] = await connection.query(`
      UPDATE NHAN_KHAU
      SET ${fields.join(', ')}
      WHERE MANHANKHAU = ?
    `, values);

    // ✅ XỬ LÝ CẬP NHẬT THÔNG TIN BIẾN ĐỘNG
    if (result.affectedRows > 0) {
      const { TRANGTHAI, NOICHUYEN, GHICHU, NGAYCHUYENDI } = updatedData;

      // Nếu trạng thái thay đổi HOẶC có dữ liệu biến động được gửi lên
      if (TRANGTHAI || NOICHUYEN || GHICHU || NGAYCHUYENDI) {

        // Xác định loại biến động
        let loaiBienDong = null;
        if (TRANGTHAI === 'ChuyenDi') loaiBienDong = 'ChuyenDi';
        else if (TRANGTHAI === 'DaQuaDoi') loaiBienDong = 'QuaDoi';
        else if (TRANGTHAI === 'TamVang') loaiBienDong = 'TamVang';

        // Nếu không có trạng thái đặc biệt, xem trạng thái hiện tại
        if (!loaiBienDong && old.TRANGTHAI === 'ChuyenDi') loaiBienDong = 'ChuyenDi';
        else if (!loaiBienDong && old.TRANGTHAI === 'DaQuaDoi') loaiBienDong = 'QuaDoi';
        else if (!loaiBienDong && old.TRANGTHAI === 'TamVang') loaiBienDong = 'TamVang';

        // Nếu có loại biến động đặc biệt
        if (loaiBienDong) {
          // ✅ KIỂM TRA XEM ĐÃ CÓ LOG CHO LOẠI NÀY CHƯA
          const [existingLog] = await connection.query(`
            SELECT ID FROM LICH_SU_NHAN_KHAU
            WHERE MANHANKHAU = ?
            AND LOAI_BIEN_DONG = ?
            ORDER BY NGAY_BIEN_DONG DESC, ID DESC
            LIMIT 1
          `, [id, loaiBienDong]);

          if (existingLog.length > 0) {
            // ✅ CẬP NHẬT LOG CŨ (QUAN TRỌNG!)
            const updateLogFields = [];
            const updateLogValues = [];

            if (NGAYCHUYENDI) {
              updateLogFields.push('NGAY_BIEN_DONG = ?');
              updateLogValues.push(NGAYCHUYENDI);
            }
            if (NOICHUYEN && loaiBienDong !== 'QuaDoi') {
              updateLogFields.push('NOI_CHUYEN_DEN = ?');
              updateLogValues.push(NOICHUYEN);
            }
            if (GHICHU) {
              updateLogFields.push('LYDO = ?');
              updateLogValues.push(GHICHU);
            }

            if (updateLogFields.length > 0) {
              updateLogFields.push('UPDATED_AT = NOW()');
              updateLogValues.push(existingLog[0].ID);

              await connection.query(`
                UPDATE LICH_SU_NHAN_KHAU
                SET ${updateLogFields.join(', ')}
                WHERE ID = ?
              `, updateLogValues);
            }
          } else {
            // ✅ TẠO LOG MỚI NẾU CHƯA CÓ
            let lydo = GHICHU || '';
            let noiChuyen = null;

            if (loaiBienDong === 'ChuyenDi') {
              noiChuyen = NOICHUYEN || 'Chưa xác định';
              lydo = lydo || `Chuyển đi: ${noiChuyen}`;
            } else if (loaiBienDong === 'QuaDoi') {
              lydo = lydo || 'Đã qua đời';
            } else if (loaiBienDong === 'TamVang') {
              noiChuyen = NOICHUYEN;
              lydo = lydo || `Tạm vắng: ${GHICHU || 'Chưa rõ lý do'}`;
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

    await connection.query(`
      INSERT INTO LICH_SU_NHAN_KHAU (
        MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG,
        LYDO, NGUOI_THUC_HIEN
      ) VALUES (?, 'Xoa', CURDATE(), 'Xóa nhân khẩu khỏi hệ thống', ?)
    `, [id, deletedBy]);

    await connection.query(
      'DELETE FROM HO_KHAU_NHAN_KHAU WHERE MANHANKHAU = ?',
      [id]
    );

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

    const [check] = await connection.query(`
      SELECT SOHOKHAU FROM HO_KHAU_NHAN_KHAU
      WHERE MANHANKHAU = ? AND TRANGTHAI = 'DangO'
    `, [manhankhau]);

    if (check.length > 0) {
      throw new Error('Nhân khẩu đã thuộc hộ khẩu khác');
    }

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

    await connection.query(`
      INSERT INTO HO_KHAU_NHAN_KHAU (
        SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO,
        NGAY_VAO_HO, TRANGTHAI
      ) VALUES (?, ?, ?, ?, CURDATE(), 'DangO')
    `, [sohokhau, manhankhau, quanhechuho, laChuHo]);

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

    await connection.query(`
      UPDATE HO_KHAU_NHAN_KHAU
      SET TRANGTHAI = 'DaRoi',
          NGAY_ROI_HO = CURDATE(),
          LYDO_ROI_HO = ?
      WHERE MANHANKHAU = ? AND SOHOKHAU = ?
    `, [lydo, manhankhau, sohokhau]);

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