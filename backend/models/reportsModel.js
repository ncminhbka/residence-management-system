// backend/models/reportsModel.js
const db = require('../db');

const ReportsModel = {
    // 1. Thống kê biến động (Hàm cũ)
    getFluctuationStats: async (startDate, endDate) => {
        const queries = [
            db.execute(`
                SELECT COUNT(*) as count FROM NHAN_KHAU 
                WHERE (TRANGTHAI = 'ThuongTru' OR TRANGTHAI = 'MoiThem')
                AND CREATED_AT BETWEEN ? AND ?
            `, [startDate + ' 00:00:00', endDate + ' 23:59:59']),

            db.execute(`
                SELECT COUNT(*) as count FROM TAM_TRU 
                WHERE NGAYBATDAU BETWEEN ? AND ?
            `, [startDate, endDate]),

            db.execute(`
                SELECT COUNT(*) as count FROM TAM_VANG 
                WHERE NGAYBATDAU BETWEEN ? AND ?
            `, [startDate, endDate]),

            db.execute(`
                SELECT COUNT(*) as count FROM NHAN_KHAU 
                WHERE TRANGTHAI = 'ChuyenDi'
                AND UPDATED_AT BETWEEN ? AND ?
            `, [startDate + ' 00:00:00', endDate + ' 23:59:59']),

            db.execute(`
                SELECT COUNT(*) as count FROM NHAN_KHAU 
                WHERE TRANGTHAI = 'DaQuaDoi'
                AND UPDATED_AT BETWEEN ? AND ?
            `, [startDate + ' 00:00:00', endDate + ' 23:59:59'])
        ];

        return Promise.all(queries);
    }, // <--- QUAN TRỌNG: Dấu phẩy này ngăn cách 2 hàm

    // 2. Thống kê dân số theo tháng (ĐÃ SỬA LỖI NGÀY THÁNG)
    getPopulationByMonth: async (year) => {
        const queries = [];
        
        for (let month = 1; month <= 12; month++) {
            // Tạo ngày cuối tháng chính xác (tránh lỗi múi giờ UTC của toISOString)
            // new Date(year, month, 0) -> Ngày cuối của tháng trước đó (vì month chạy từ 1-12, JS hiểu là tháng 2-13, day=0 lùi lại 1 ngày)
            const d = new Date(year, month, 0); 
            
            // Format thủ công: YYYY-MM-DD 23:59:59
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const lastDay = `${yyyy}-${mm}-${dd} 23:59:59`;
            
            // Query: Đếm người có ngày tạo <= cuối tháng VÀ (Vẫn ở đó HOẶC Chuyển đi sau ngày đó)
            const sql = `
                SELECT COUNT(*) as count FROM NHAN_KHAU 
                WHERE (CREATED_AT IS NULL OR CREATED_AT <= ?) 
                AND (
                    TRANGTHAI IN ('ThuongTru', 'TamTru', 'TamVang', 'MoiThem')
                    OR 
                    (TRANGTHAI IN ('ChuyenDi', 'DaQuaDoi') AND UPDATED_AT > ?)
                )
            `;
            queries.push(db.execute(sql, [lastDay, lastDay]));
        }

        return Promise.all(queries);
    }
};

module.exports = ReportsModel;