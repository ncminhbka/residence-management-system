// backend/models/residencechangesModel.js
const db = require('../db'); 

const ResidenceChangesModel = {
  // --- TẠM VẮNG (ĐÃ SỬA: Cập nhật trạng thái nhân khẩu) ---
  addTamVang: async (data) => {
    const maGiay = `TV_${Date.now()}`;
    
    // 1. Lấy kết nối từ Pool để dùng Transaction
    const connection = await db.getConnection();

    try {
      // Bắt đầu giao dịch
      await connection.beginTransaction();

      // Bước 1: Thêm giấy tạm vắng
      const sqlInsert = `
        INSERT INTO TAM_VANG (MANHANKHAU, MAGIAYTAMVANG, NOITAMTRU, NGAYBATDAU, NGAYKETTHUC, LYDO, TRANGTHAI)
        VALUES (?, ?, ?, ?, ?, ?, 'DangTamVang')
      `;
      await connection.query(sqlInsert, [
        data.manhankhau, maGiay, data.noiden, data.tungay, data.denngay, data.lydo
      ]);

      // Bước 2: Cập nhật trạng thái nhân khẩu thành 'TamVang'
      const sqlUpdateStatus = `
        UPDATE NHAN_KHAU 
        SET TRANGTHAI = 'TamVang' 
        WHERE MANHANKHAU = ?
      `;
      await connection.query(sqlUpdateStatus, [data.manhankhau]);

      // Nếu muốn ghi lịch sử biến động tự động (Optional)
      // Bạn có thể thêm câu lệnh INSERT INTO LICH_SU_NHAN_KHAU tại đây nếu cần

      // Xác nhận giao dịch thành công
      await connection.commit();
      return { success: true, message: "Khai báo thành công" };

    } catch (error) {
      // Nếu có lỗi, hoàn tác tất cả
      await connection.rollback();
      throw error;
    } finally {
      // Trả kết nối về pool
      connection.release();
    }
  },

  getAllTamVang: async () => {
    const sql = `
      SELECT tv.*, nk.HOTEN, nk.CCCD 
      FROM TAM_VANG tv
      JOIN NHAN_KHAU nk ON tv.MANHANKHAU = nk.MANHANKHAU
      ORDER BY tv.CREATED_AT DESC
    `;
    return db.execute(sql);
  },

  // --- TẠM TRÚ (Giữ nguyên) ---
  addTamTru: async (data) => {
    const maGiay = `TT_${Date.now()}`;
    const sql = `
      INSERT INTO TAM_TRU (MANHANKHAU, MAGIAYTAMTRU, DIACHITAMTRU, NGAYBATDAU, NGAYKETTHUC, GHICHU, TRANGTHAI)
      VALUES (?, ?, ?, ?, ?, ?, 'DangHieuLuc')
    `;
    return db.execute(sql, [
      data.manhankhau, maGiay, data.diachi, data.tungay, data.denngay, data.lydo
    ]);
  },

  getAllTamTru: async () => {
    const sql = `
      SELECT tt.*, nk.HOTEN, nk.CCCD, nk.NGAYSINH
      FROM TAM_TRU tt
      JOIN NHAN_KHAU nk ON tt.MANHANKHAU = nk.MANHANKHAU
      ORDER BY tt.CREATED_AT DESC
    `;
    return db.execute(sql);
  },

  // [SỬA] Update Tạm Vắng
  updateTamVang: async (id, data) => {
    const sql = `
      UPDATE TAM_VANG 
      SET MANHANKHAU = ?, NOITAMTRU = ?, NGAYBATDAU = ?, NGAYKETTHUC = ?, LYDO = ?
      WHERE MAGIAYTAMVANG = ?
    `;
    return db.execute(sql, [
      data.manhankhau, data.noiden, data.tungay, data.denngay, data.lydo, id
    ]);
  },

  // [SỬA] Update Tạm Trú
  updateTamTru: async (id, data) => {
    const sql = `
      UPDATE TAM_TRU 
      SET MANHANKHAU = ?, DIACHITAMTRU = ?, NGAYBATDAU = ?, NGAYKETTHUC = ?, GHICHU = ?
      WHERE MAGIAYTAMTRU = ?
    `;
    return db.execute(sql, [
      data.manhankhau, data.diachi, data.tungay, data.denngay, data.lydo, id
    ]);
  },

  // --- Thống kê ---
  getStats: async () => {
    const [tamTruActive] = await db.execute(`SELECT COUNT(*) as count FROM TAM_TRU WHERE TRANGTHAI = 'DangHieuLuc'`);
    const [tamTruExpiring] = await db.execute(`SELECT COUNT(*) as count FROM TAM_TRU WHERE TRANGTHAI = 'DangHieuLuc' AND NGAYKETTHUC BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`);
    const [tamVangActive] = await db.execute(`SELECT COUNT(*) as count FROM TAM_VANG WHERE TRANGTHAI = 'DangTamVang'`);
    const [tamVangReturned] = await db.execute(`SELECT COUNT(*) as count FROM TAM_VANG WHERE TRANGTHAI = 'DaTroVe'`);
    return {
      tamTruActive: tamTruActive[0]?.count || 0,
      tamTruExpiring: tamTruExpiring[0]?.count || 0,
      tamVangActive: tamVangActive[0]?.count || 0,
      tamVangReturned: tamVangReturned[0]?.count || 0
    };
  }
};

module.exports = ResidenceChangesModel;