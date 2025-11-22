const Resident = require('../models/residentModel');

// === HÀM CHUẨN HÓA NGÀY THÁNG THÔNG MINH ===
const formatDatabaseDate = (dateString) => {
    if (!dateString) return null;

    // 1. Chuyển về chuỗi và xóa khoảng trắng thừa
    const cleanStr = dateString.toString().trim();

    // 2. Nếu đã chuẩn YYYY-MM-DD (Ví dụ: 2000-01-30) => Giữ nguyên
    if (cleanStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return cleanStr;
    }

    // 3. Xử lý trường hợp DD/MM/YYYY (Ví dụ: 30/01/2000)
    if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1]}-${parts[2]}`;
            }
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }

    // 4. Xử lý trường hợp DD-MM-YYYY (Ví dụ: 30-01-2000)
    if (cleanStr.includes('-')) {
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            if (parts[2].length === 4) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
    }

    return null;
};

// === LẤY TẤT CẢ NHÂN KHẨU ===
exports.getAllResidents = async (req, res) => {
    try {
        const residents = await Resident.getAllResidents();
        res.status(200).json({ success: true, data: residents });
    } catch (error) {
        console.error("Get all residents error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// === TÌM KIẾM NHÂN KHẨU ===
exports.searchResidents = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });
        }
        const residents = await Resident.searchResidents(query);
        res.status(200).json({ success: true, data: residents });
    } catch (error) {
        console.error("Search residents error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// === LẤY CHI TIẾT NHÂN KHẨU ===
exports.getResidentDetails = async (req, res) => {
    try {
        const manhankhau = req.params.id;
        const residents = await Resident.getAllResidents();
        const resident = residents.find(r => r.MANHANKHAU == manhankhau);

        if (!resident) {
            return res.status(404).json({ success: false, error: 'Không tìm thấy nhân khẩu' });
        }

        res.status(200).json({ success: true, data: resident });
    } catch (error) {
        console.error("Get resident details error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// === THÊM NHÂN KHẨU MỚI ===
exports.createResident = async (req, res) => {
    try {
        const {
            hoten, bidanh, ngaysinh, gioitinh, noisinh, nguyenquan,
            dantoc, quoctich, cccd, noilamviec, nghenghiep, ngaycap, noicap,
            sohokhau, quanhechuho, trangthai, noithuongtrucu
        } = req.body;

        if (!hoten || !ngaysinh || !gioitinh || !noisinh || !nguyenquan || !dantoc || !quoctich || !trangthai) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin bắt buộc (họ tên, ngày sinh, giới tính...)'
            });
        }

        const formattedNgaysinh = formatDatabaseDate(ngaysinh);
        const formattedNgaycap = formatDatabaseDate(ngaycap);

        if (ngaysinh && !formattedNgaysinh) {
            return res.status(400).json({
                success: false,
                error: 'Ngày sinh không đúng định dạng (Vui lòng nhập DD/MM/YYYY hoặc YYYY-MM-DD)'
            });
        }

        const result = await Resident.addResident({
            hoten,
            bidanh,
            ngaysinh: formattedNgaysinh,
            gioitinh,
            noisinh,
            nguyenquan,
            dantoc,
            quoctich,
            cccd,
            noilamviec,
            nghenghiep,
            ngaycap: formattedNgaycap,
            noicap,
            sohokhau,
            quanhechuho,
            trangthai,
            noithuongtrucu
        });

        res.status(201).json({
            success: true,
            message: 'Thêm nhân khẩu thành công',
            data: { manhankhau: result.insertId }
        });

    } catch (error) {
        console.error("Create resident error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'Số CCCD/CMND đã tồn tại trong hệ thống' });
        }
        res.status(500).json({ success: false, error: 'Lỗi hệ thống: ' + error.message });
    }
};

// === CẬP NHẬT NHÂN KHẨU (Đã cập nhật logic biến động) ===
exports.updateResident = async (req, res) => {
    try {
        const manhankhau = req.params.id;

        // [QUAN TRỌNG] Thêm các trường biến động vào danh sách cho phép
        const allowedFields = [
            'HOTEN', 'BIDANH', 'NGAYSINH', 'GIOITINH', 'NOISINH', 'NGUYENQUAN',
            'DANTOC', 'QUOCTICH', 'CCCD', 'NOILAMVIEC', 'NGHENGHIEP', 'NGAYCAP', 'NOICAP',
            'SOHOKHAU', 'QUANHECHUHO', 'TRANGTHAI', 'NOITHUONGTRUCU',
            // Các trường phụ phục vụ ghi log biến động
            'NOICHUYEN', 'GHICHU', 'NGAYCHUYENDI'
        ];

        const fieldMap = Object.fromEntries(allowedFields.map(f => [f.toLowerCase(), f]));
        const updatedData = {};

        for (const [key, value] of Object.entries(req.body)) {
            const dbKey = fieldMap[key.toLowerCase()];
            if (dbKey && value !== undefined) {
                // Xử lý định dạng ngày cho cả NGAYCHUYENDI
                if (['NGAYSINH', 'NGAYCAP', 'NGAYCHUYENDI'].includes(dbKey)) {
                    const formattedDate = formatDatabaseDate(value);
                    if (formattedDate) {
                        updatedData[dbKey] = formattedDate;
                    }
                } else {
                    updatedData[dbKey] = value;
                }
            }
        }

        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({ success: false, error: 'Không có dữ liệu hợp lệ để cập nhật' });
        }

        const result = await Resident.updateResident(manhankhau, updatedData);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Nhân khẩu không tồn tại' });
        }

        res.status(200).json({ success: true, message: 'Cập nhật nhân khẩu thành công' });

    } catch (error) {
        console.error("Update resident error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'Số CCCD/CMND bị trùng lặp' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// === XÓA NHÂN KHẨU ===
exports.deleteResident = async (req, res) => {
    try {
        const manhankhau = req.params.id;
        const result = await Resident.deleteResident(manhankhau);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Nhân khẩu không tồn tại' });
        }

        res.status(200).json({ success: true, message: 'Xóa nhân khẩu thành công' });
    } catch (error) {
        console.error("Delete resident error:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ success: false, error: 'Không thể xóa nhân khẩu này vì đang liên kết với dữ liệu khác (Hộ khẩu, Tạm trú...)' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// === LẤY LỊCH SỬ ===
exports.getResidentHistory = async (req, res) => {
    try {
        const manhankhau = req.params.id;
        const history = await Resident.getResidentHistory(manhankhau);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error("Get history error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};