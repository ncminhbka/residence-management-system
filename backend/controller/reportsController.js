// backend/controller/reportsController.js
const ReportsModel = require('../models/reportsModel');

exports.getFluctuationReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        
        // Mặc định ngày nếu không có
        const startDate = start || '2000-01-01';
        const endDate = end || '2099-12-31';

        // Gọi Model (nhận về mảng 5 kết quả)
        const results = await ReportsModel.getFluctuationStats(startDate, endDate);

        // Kết quả db.execute trả về dạng [[rows], [fields]], ta lấy phần tử đầu tiên
        const stats = {
            TaoMoi: results[0][0][0].count,   // Kết quả query 1
            TamTru: results[1][0][0].count,   // Kết quả query 2
            TamVang: results[2][0][0].count,  // Kết quả query 3
            ChuyenDi: results[3][0][0].count, // Kết quả query 4
            QuaDoi: results[4][0][0].count    // Kết quả query 5
        };

        res.json({ success: true, data: stats });
    } catch (err) {
        console.error("Lỗi báo cáo:", err);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

exports.getPopulationReport = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        
        // Gọi model lấy dữ liệu 12 tháng
        const results = await ReportsModel.getPopulationByMonth(year);
        
        // Chuyển đổi kết quả từ [[Row], [Row]...] thành mảng số [100, 102, ...]
        const data = results.map(r => r[0][0].count);
        
        res.json({ success: true, data: data, year: year });
    } catch (err) {
        console.error("Lỗi báo cáo tháng:", err);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};