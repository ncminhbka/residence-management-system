// backend/models/facilitiesModel.js
const db = require('../db');

const FacilitiesModel = {
    // --- QUẢN LÝ TÀI SẢN ---
    getAllAssets: async () => {
        const sql = `SELECT * FROM TAI_SAN ORDER BY TENTAISAN ASC`;
        return db.execute(sql);
    },

    addAsset: async (data) => {
        const sql = `INSERT INTO TAI_SAN (TENTAISAN, SOLUONG_TOT, SOLUONG_HONG, DON_VI_TINH, GIA_TRI_MUA) VALUES (?, ?, ?, ?, ?)`;
        return db.execute(sql, [data.ten, data.slTot, data.slHong, data.donvi, data.giatri]);
    },

    updateAsset: async (id, data) => {
        const sql = `UPDATE TAI_SAN SET SOLUONG_TOT = ?, SOLUONG_HONG = ?, TENTAISAN = ? WHERE MATAISAN = ?`;
        return db.execute(sql, [data.slTot, data.slHong, data.ten, id]);
    },

    deleteAsset: async (id) => {
        const sql = `DELETE FROM TAI_SAN WHERE MATAISAN = ?`;
        return db.execute(sql, [id]);
    },

    // --- QUẢN LÝ LỊCH SỬ DỤNG ---
    getAllEvents: async () => {
        const sql = `
            SELECT * FROM HOAT_DONG 
            ORDER BY NGAYBATDAU DESC
        `;
        return db.execute(sql);
    },

    // Kiểm tra trùng lịch (Chỉ kiểm tra với các sự kiện Đã duyệt hoặc Chờ duyệt)
    checkOverlap: async (start, end) => {
        const sql = `
            SELECT * FROM HOAT_DONG 
            WHERE TRANGTHAI_DUYET != 'Huy' 
            AND (
                (NGAYBATDAU <= ? AND NGAYKETTHUC >= ?) OR 
                (NGAYBATDAU <= ? AND NGAYKETTHUC >= ?) OR
                (NGAYBATDAU >= ? AND NGAYKETTHUC <= ?)
            )
        `;
        return db.execute(sql, [start, start, end, end, start, end]);
    },

    addEvent: async (data) => {
        const sql = `
            INSERT INTO HOAT_DONG (TENSUKIEN, MO_TA, NGAYBATDAU, NGAYKETTHUC, LOAISUKIEN, PHI_SU_DUNG, TRANGTHAI_DUYET, NGUOI_TAO)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        return db.execute(sql, [
            data.ten, 
            data.mota, 
            data.start, 
            data.end, 
            data.loai, 
            data.phi || 0, 
            data.trangthai, // 'ChoDuyet' hoặc 'DaDuyet'
            data.nguoitao
        ]);
    },

    updateEventStatus: async (id, status, phi) => {
        const sql = `UPDATE HOAT_DONG SET TRANGTHAI_DUYET = ?, PHI_SU_DUNG = ? WHERE MASUKIEN = ?`;
        return db.execute(sql, [status, phi, id]);
    }
};

module.exports = FacilitiesModel;