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
  }
};

module.exports = ResidenceChangesModel;