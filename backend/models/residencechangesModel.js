// backend/models/residencechangesModel.js
const db = require('../db'); // Trỏ đúng về file db.js của bạn

const ResidenceChangesModel = {
  // --- TẠM VẮNG ---
  addTamVang: async (data) => {
    const maGiay = `TV_${Date.now()}`;
    const sql = `
      INSERT INTO TAM_VANG (MANHANKHAU, MAGIAYTAMVANG, NOITAMTRU, NGAYBATDAU, NGAYKETTHUC, LYDO, TRANGTHAI)
      VALUES (?, ?, ?, ?, ?, ?, 'DangTamVang')
    `;
    return db.execute(sql, [
      data.manhankhau, maGiay, data.noiden, data.tungay, data.denngay, data.lydo
    ]);
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

  // --- TẠM TRÚ ---
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

  // --- Thống kê ---
  getStats: async () => {
    // Tạm trú đang hoạt động
    const [tamTruActive] = await db.execute(`SELECT COUNT(*) as count FROM TAM_TRU WHERE TRANGTHAI = 'DangHieuLuc'`);
    // Tạm trú sắp hết hạn (trong 7 ngày tới)
    const [tamTruExpiring] = await db.execute(`SELECT COUNT(*) as count FROM TAM_TRU WHERE TRANGTHAI = 'DangHieuLuc' AND NGAYKETTHUC BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`);
    // Tạm vắng đang hoạt động
    const [tamVangActive] = await db.execute(`SELECT COUNT(*) as count FROM TAM_VANG WHERE TRANGTHAI = 'DangTamVang'`);
    // Tạm vắng đã trở về
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