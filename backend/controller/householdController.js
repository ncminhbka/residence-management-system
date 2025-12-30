const Household = require('../models/householdModel');

// ============================================
// 1. LẤY DANH SÁCH HỘ KHẨU
// ============================================
exports.getAllHouseholds = async (req, res) => {
    try {
        const households = await Household.getAllHousehold();
        res.status(200).json({
            success: true,
            data: households,
            pagination: {
                totalItems: households.length,
                totalPages: Math.ceil(households.length / 10),
                currentPage: 1
            }
        });
    } catch (error) {
        console.error('Get all households error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ: ' + error.message
        });
    }
};

// ============================================
// 2. TÌM KIẾM HỘ KHẨU
// ============================================
exports.searchHouseholds = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin tìm kiếm'
            });
        }

        const households = await Household.searchHouseholds(query);
        res.status(200).json({ success: true, data: households });
    } catch (error) {
        console.error('Search households error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi máy chủ: ' + error.message
        });
    }
};

// ============================================
// 3. TẠO HỘ KHẨU MỚI
// ============================================
exports.createHousehold = async (req, res) => {
    try {
        const { manhankhauchuho, diachi, hososo, sodangkyso, toso } = req.body;
        const userId = req.user?.id;

        if (!manhankhauchuho || !diachi || !hososo || !sodangkyso || !toso) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin bắt buộc'
            });
        }

        // Kiểm tra chủ hộ đã đứng tên hộ nào chưa
        const isTaken = await Household.isHoKhauTaken(manhankhauchuho);
        if (isTaken) {
            return res.status(400).json({
                success: false,
                error: 'Nhân khẩu này đã là chủ hộ của một hộ khẩu khác'
            });
        }

        const newHousehold = await Household.addHouseholds(
            manhankhauchuho,
            diachi,
            hososo,
            sodangkyso,
            toso,
            userId
        );

        res.status(201).json({
            success: true,
            message: 'Tạo mới hộ khẩu thành công',
            data: {
                sohokhau: newHousehold.insertId,
                manhankhauchuho,
                diachi,
                hososo,
                sodangkyso,
                toso
            }
        });
    } catch (error) {
        console.error('Create household error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi máy chủ'
        });
    }
};

// ============================================
// 4. CẬP NHẬT HỘ KHẨU
// ============================================
exports.updateHousehold = async (req, res) => {
    try {
        const sohokhau = req.params.id;
        const { diachi, hososo, sodangkyso, toso } = req.body;
        const userId = req.user?.id;

        const result = await Household.updateHouseholds(
            sohokhau,
            { diachi, hososo, sodangkyso, toso },
            userId
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hộ khẩu không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật hộ khẩu thành công'
        });
    } catch (error) {
        console.error('Update household error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi máy chủ'
        });
    }
};

// ============================================
// 5. XÓA HỘ KHẨU
// ============================================
exports.deleteHousehold = async (req, res) => {
    try {
        const sohokhau = req.params.id;
        const userId = req.user?.id;

        const result = await Household.deleteHouseholds(sohokhau, userId);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hộ khẩu không tồn tại'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa hộ khẩu thành công'
        });
    } catch (error) {
        console.error('Delete household error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi máy chủ'
        });
    }
};

// ============================================
// 6. XEM CHI TIẾT HỘ KHẨU
// ============================================
exports.getHouseholdDetails = async (req, res) => {
    try {
        const sohokhau = req.params.id;

        // Lấy thông tin hộ khẩu
        const household = await Household.searchHouseholds(sohokhau);
        if (!household || household.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Hộ khẩu không tồn tại'
            });
        }

        // Lấy danh sách thành viên
        const members = await Household.getHouseholdDetails(sohokhau);

        res.status(200).json({
            success: true,
            data1: household,
            data2: members || []
        });
    } catch (error) {
        console.error('Get household details error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi máy chủ'
        });
    }
};

// ============================================
// 7. ĐỔI CHỦ HỘ (MỚI)
// ============================================
exports.changeOwner = async (req, res) => {
    try {
        const sohokhau = req.params.id;
        const { newOwnerId } = req.body;
        const userId = req.user?.id;

        if (!newOwnerId) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin chủ hộ mới'
            });
        }

        await Household.changeHouseholdOwner(sohokhau, newOwnerId, userId);

        res.status(200).json({
            success: true,
            message: 'Đổi chủ hộ thành công'
        });
    } catch (error) {
        console.error('Change owner error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi máy chủ'
        });
    }
};

// ============================================
// 8. THAY ĐỔI QUAN HỆ THÀNH VIÊN (MỚI)
// ============================================
exports.updateMemberRelation = async (req, res) => {
    try {
        const sohokhau = req.params.id;
        const { memberId, newRelation } = req.body;
        const userId = req.user?.id;

        if (!memberId || !newRelation) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin'
            });
        }

        await Household.updateMemberRelation(
            sohokhau,
            memberId,
            newRelation,
            userId
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật quan hệ thành công'
        });
    } catch (error) {
        console.error('Update relation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi máy chủ'
        });
    }
};

// ============================================
// 9. TÁCH HỘ KHẨU 
// ============================================
exports.splitHousehold = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            sohokhaugoc,
            thongtinhokhaumoi,
            thanhviensanghokhaumoi,
            quanheThanhVien  // MỚI: Object chứa quan hệ của từng thành viên
        } = req.body;

        // Validate
        if (!sohokhaugoc || !thongtinhokhaumoi || !thanhviensanghokhaumoi) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin tách hộ'
            });
        }

        const { machuhomoi, diachimoi, hososomoi, sodangkysomoi, tosomoi } = thongtinhokhaumoi;

        if (!machuhomoi || !diachimoi || !hososomoi || !sodangkysomoi || !tosomoi) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin hộ khẩu mới'
            });
        }

        if (!thanhviensanghokhaumoi || thanhviensanghokhaumoi.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Vui lòng chọn ít nhất một thành viên để chuyển'
            });
        }

        // Kiểm tra chủ hộ mới có bị trùng không
        const isTaken = await Household.isHoKhauTaken(machuhomoi);
        if (isTaken) {
            return res.status(400).json({
                success: false,
                error: 'Chủ hộ mới đã là chủ hộ của hộ khẩu khác'
            });
        }

        // Tách hộ
        const result = await Household.splitHousehold(
            sohokhaugoc,
            {
                machuho: machuhomoi,
                diachi: diachimoi,
                hososo: hososomoi,
                sodangkyso: sodangkysomoi,
                toso: tosomoi,
                quanheThanhVien: quanheThanhVien || {}  // Truyền thêm quan hệ
            },
            thanhviensanghokhaumoi,
            userId
        );

        res.status(200).json({
            success: true,
            message: 'Tách hộ khẩu thành công',
            data: { sohokhaumoi: result.insertId }
        });
    } catch (error) {
        console.error('Split household error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi máy chủ'
        });
    }
};

// ============================================
// 10. THÊM THÀNH VIÊN VÀO HỘ KHẨU 
// ============================================
exports.addMemberToHousehold = async (req, res) => {
    try {
        const sohokhau = req.params.id;
        const { manhankhau, quanhechuho } = req.body;
        const userId = req.user?.id;

        if (!manhankhau || !quanhechuho) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin thành viên'
            });
        }

        await Household.addMemberToHousehold(sohokhau, manhankhau, quanhechuho, userId);

        res.status(200).json({
            success: true,
            message: 'Thêm thành viên vào hộ khẩu thành công'
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi máy chủ'
        });
    }
};

// ============================================
// 11. XÓA THÀNH VIÊN KHỎI HỘ KHẨU 
// ============================================
exports.removeMemberFromHousehold = async (req, res) => {
    try {
        const sohokhau = req.params.id;
        const { manhankhau, lydo } = req.body;
        const userId = req.user?.id;

        if (!manhankhau) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin thành viên cần xóa'
            });
        }

        await Household.removeMemberFromHousehold(
            sohokhau, 
            manhankhau, 
            lydo || 'Không rõ lý do', 
            userId
        );

        res.status(200).json({
            success: true,
            message: 'Xóa thành viên khỏi hộ khẩu thành công'
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi máy chủ'
        });
    }
};


// ============================================
// 12. XEM LỊCH SỬ BIẾN ĐỘNG HỘ KHẨU
// ============================================
exports.getHouseholdHistory = async (req, res) => {
    try {
        const sohokhau = req.params.id;
        const history = await Household.getHouseholdHistory(sohokhau);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error("Get household history error:", error);
        res.status(500).json({ success: false, error: error.message || 'Lấy lịch sử hộ khẩu bị lỗi rồi bro!' });
    }
};