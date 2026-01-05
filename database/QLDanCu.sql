-- ============================================================
-- HỆ THỐNG QUẢN LÝ DÂN CƯ
-- ============================================================

DROP DATABASE IF EXISTS ToDanPho7;
CREATE DATABASE ToDanPho7 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ToDanPho7;

-- ============================================================
-- 1. BẢNG NHÂN KHẨU 
-- ============================================================
CREATE TABLE NHAN_KHAU (
    MANHANKHAU INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Thông tin cá nhân cơ bản
    HOTEN VARCHAR(100) NOT NULL,
    BIDANH VARCHAR(50) DEFAULT NULL,
    NGAYSINH DATE NOT NULL,
    GIOITINH ENUM('Nam', 'Nữ', 'Khác') NOT NULL,
    
    -- Nơi sinh & Nguyên quán
    NOISINH VARCHAR(100) NOT NULL,
    NGUYENQUAN VARCHAR(100) NOT NULL,
    DANTOC VARCHAR(30) DEFAULT 'Kinh',
    QUOCTICH VARCHAR(20) DEFAULT 'Việt Nam',
    
    -- Giấy tờ tùy thân
    CCCD VARCHAR(20) UNIQUE DEFAULT NULL,
    NGAYCAP_CCCD DATE DEFAULT NULL,
    NOICAP_CCCD VARCHAR(100) DEFAULT NULL,
    
    -- Thông tin công việc
    NGHENGHIEP VARCHAR(50) DEFAULT NULL,
    NOILAMVIEC VARCHAR(100) DEFAULT NULL,
    
    -- Địa chỉ thường trú cũ (trước khi vào hộ khẩu hiện tại)
    NOITHUONGTRUCU VARCHAR(100) DEFAULT NULL,
    
    -- Trạng thái hiện tại của nhân khẩu
    TRANGTHAI ENUM('ThuongTru', 'TamTru', 'TamVang', 'ChuyenDi', 'DaQuaDoi', 'MoiSinh') 
        NOT NULL DEFAULT 'ThuongTru',
    
    -- Metadata
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CREATED_BY INT DEFAULT NULL,
    UPDATED_BY INT DEFAULT NULL,
    
    -- Indexes để tăng tốc tìm kiếm
    INDEX idx_hoten (HOTEN),
    INDEX idx_cccd (CCCD),
    INDEX idx_trangthai (TRANGTHAI),
    INDEX idx_ngaysinh (NGAYSINH)
) ENGINE=InnoDB COMMENT='Bảng lưu thông tin nhân khẩu';

-- ============================================================
-- 2. BẢNG HỘ KHẨU 
-- ============================================================
CREATE TABLE HO_KHAU (
    SOHOKHAU INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Thông tin hộ khẩu
    DIACHI VARCHAR(200) NOT NULL,
    HOSOSO INT NOT NULL,
    SODANGKYSO INT NOT NULL,
    TOSO INT NOT NULL,
    NGAYCAP DATE NOT NULL,
    
    -- Trạng thái hộ khẩu
    TRANGTHAI ENUM('HoatDong', 'DaGiai', 'TachHo', 'NhapHo') 
        NOT NULL DEFAULT 'HoatDong',
    
    -- Metadata
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CREATED_BY INT DEFAULT NULL,
    UPDATED_BY INT DEFAULT NULL,
    
    -- Indexes
    INDEX idx_diachi (DIACHI),
    INDEX idx_trangthai (TRANGTHAI),
    
    UNIQUE KEY unique_hososo (HOSOSO, SODANGKYSO, TOSO)
) ENGINE=InnoDB COMMENT='Bảng lưu thông tin hộ khẩu';

-- ============================================================
-- 3. BẢNG QUAN HỆ HỘ KHẨU - NHÂN KHẨU
-- ============================================================
CREATE TABLE HO_KHAU_NHAN_KHAU (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    SOHOKHAU INT NOT NULL,
    MANHANKHAU INT NOT NULL,
    
    -- Quan hệ với chủ hộ
    QUANHECHUHO VARCHAR(30) NOT NULL,
    LA_CHU_HO BOOLEAN DEFAULT FALSE,
    
    -- Thời gian gia nhập/rời hộ
    NGAY_VAO_HO DATE NOT NULL,
    NGAY_ROI_HO DATE DEFAULT NULL,
    
    -- Lý do rời hộ (nếu có)
    LYDO_ROI_HO VARCHAR(255) DEFAULT NULL,
    
    -- Trạng thái
    TRANGTHAI ENUM('DangO', 'DaRoi') DEFAULT 'DangO',
    
    -- Metadata
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (SOHOKHAU) REFERENCES HO_KHAU(SOHOKHAU) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (MANHANKHAU) REFERENCES NHAN_KHAU(MANHANKHAU) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    
    
    INDEX idx_sohokhau (SOHOKHAU),
    INDEX idx_manhankhau (MANHANKHAU),
    INDEX idx_trangthai (TRANGTHAI)
) ENGINE=InnoDB COMMENT='Bảng quan hệ giữa hộ khẩu và nhân khẩu';

-- ============================================================
-- 4. BẢNG TẠM TRÚ 
-- ============================================================
CREATE TABLE TAM_TRU (
    MATAMTRU INT AUTO_INCREMENT PRIMARY KEY,
    MANHANKHAU INT NOT NULL,
    
    -- Thông tin giấy tờ
    MAGIAYTAMTRU VARCHAR(20) UNIQUE NOT NULL,
    
    -- Thời gian tạm trú
    NGAYBATDAU DATE NOT NULL,
    NGAYKETTHUC DATE NOT NULL,
    
    -- Địa chỉ tạm trú
    DIACHITAMTRU VARCHAR(200) NOT NULL,
    
    -- Thông tin đăng ký
    NOI_DANG_KY VARCHAR(100) DEFAULT NULL,
    NGUOI_PHE_DUYET INT DEFAULT NULL,
    NGAY_PHE_DUYET DATE DEFAULT NULL,
    
    -- Trạng thái
    TRANGTHAI ENUM('DangHieuLuc', 'HetHan', 'DaHuy') DEFAULT 'DangHieuLuc',
    
    GHICHU TEXT DEFAULT NULL,
    
    -- Metadata
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (MANHANKHAU) REFERENCES NHAN_KHAU(MANHANKHAU)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_manhankhau (MANHANKHAU),
    INDEX idx_trangthai (TRANGTHAI),
    INDEX idx_ngayhethan (NGAYKETTHUC),
    
    -- Ràng buộc: ngày kết thúc phải sau ngày bắt đầu
    CONSTRAINT chk_tamtru_dates CHECK (NGAYKETTHUC > NGAYBATDAU)
) ENGINE=InnoDB COMMENT='Bảng quản lý tạm trú';

-- ============================================================
-- 5. BẢNG TẠM VẮNG
-- ============================================================
CREATE TABLE TAM_VANG (
    MATAMVANG INT AUTO_INCREMENT PRIMARY KEY,
    MANHANKHAU INT NOT NULL,
    
    -- Thông tin giấy tờ
    MAGIAYTAMVANG VARCHAR(20) UNIQUE NOT NULL,
    
    -- Thời gian tạm vắng
    NGAYBATDAU DATE NOT NULL,
    NGAYKETTHUC DATE NOT NULL,
    
    -- Nơi đến tạm trú
    NOITAMTRU VARCHAR(200) NOT NULL,
    LYDO VARCHAR(200) NOT NULL,
    
    -- Thông tin liên hệ tại nơi tạm trú
    DIACHI_LIENHE VARCHAR(200) DEFAULT NULL,
    DIENTHOAI_LIENHE VARCHAR(15) DEFAULT NULL,
    
    -- Trạng thái
    TRANGTHAI ENUM('DangTamVang', 'DaVe', 'DaHuy') DEFAULT 'DangTamVang',
    
    GHICHU TEXT DEFAULT NULL,
    
    -- Metadata
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (MANHANKHAU) REFERENCES NHAN_KHAU(MANHANKHAU)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_manhankhau (MANHANKHAU),
    INDEX idx_trangthai (TRANGTHAI),
    INDEX idx_ngayhethan (NGAYKETTHUC),
    
    CONSTRAINT chk_tamvang_dates CHECK (NGAYKETTHUC > NGAYBATDAU)
) ENGINE=InnoDB COMMENT='Bảng quản lý tạm vắng';

-- ============================================================
-- 6. BẢNG LỊCH SỬ BIẾN ĐỘNG NHÂN KHẨU 
-- ============================================================
CREATE TABLE LICH_SU_NHAN_KHAU (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    MANHANKHAU INT NOT NULL,
    
    -- Loại biến động
    LOAI_BIEN_DONG ENUM(
        'TaoMoi',           -- Tạo mới nhân khẩu
        'CapNhatThongTin',  -- Cập nhật thông tin cá nhân
        'VaoHo',            -- Gia nhập hộ khẩu
        'RoiHo',            -- Rời hộ khẩu
        'ChuyenDi',         -- Chuyển đi nơi khác
        'QuaDoi',           -- Qua đời
        'TamTru',           -- Đăng ký tạm trú
        'TamVang',          -- Đăng ký tạm vắng
        'VeThuongTru'       -- Trở về thường trú
    ) NOT NULL,
    
    -- Thông tin biến động
    NGAY_BIEN_DONG DATE NOT NULL,
    NOI_CHUYEN_DEN VARCHAR(200) DEFAULT NULL,
    LYDO TEXT DEFAULT NULL,
    
    -- Dữ liệu trước và sau thay đổi (JSON)
    DU_LIEU_CU JSON DEFAULT NULL,
    DU_LIEU_MOI JSON DEFAULT NULL,
    
    -- Metadata
    NGUOI_THUC_HIEN INT DEFAULT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (MANHANKHAU) REFERENCES NHAN_KHAU(MANHANKHAU)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_manhankhau (MANHANKHAU),
    INDEX idx_loai_bien_dong (LOAI_BIEN_DONG),
    INDEX idx_ngay_bien_dong (NGAY_BIEN_DONG)
) ENGINE=InnoDB COMMENT='Bảng lưu lịch sử biến động nhân khẩu';

-- ============================================================
-- 7. BẢNG LỊCH SỬ HỘ KHẨU 
-- ============================================================
CREATE TABLE LICH_SU_HO_KHAU (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    SOHOKHAU INT NOT NULL,
    
    -- Loại biến động
    LOAI_BIEN_DONG ENUM(
        'TaoMoi',
        'CapNhatThongTin',
        'ThemThanhVien',
        'XoaThanhVien',
        'DoiChuHo',
        'TachHo',
        'NhapHo',
        'GiaiHo'
    ) NOT NULL,
    
    -- Thông tin biến động
    NGAY_BIEN_DONG DATE NOT NULL,
    MO_TA TEXT NOT NULL,
    
    -- Dữ liệu JSON (tùy chọn)
    CHI_TIET JSON DEFAULT NULL,
    
    -- Metadata
    NGUOI_THUC_HIEN INT DEFAULT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (SOHOKHAU) REFERENCES HO_KHAU(SOHOKHAU)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_sohokhau (SOHOKHAU),
    INDEX idx_loai_bien_dong (LOAI_BIEN_DONG),
    INDEX idx_ngay_bien_dong (NGAY_BIEN_DONG)
) ENGINE=InnoDB COMMENT='Bảng lưu lịch sử biến động hộ khẩu';

-- ============================================================
-- 8. BẢNG TÀI KHOẢN 
-- ============================================================
CREATE TABLE TAI_KHOAN (
    MATAIKHOAN INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Thông tin đăng nhập
    TENDANGNHAP VARCHAR(50) UNIQUE NOT NULL,
    MATKHAU VARCHAR(255) NOT NULL,
    
    -- Thông tin cá nhân
    HOTEN VARCHAR(100) NOT NULL,
    EMAIL VARCHAR(100) UNIQUE DEFAULT NULL,
    DIENTHOAI VARCHAR(15) DEFAULT NULL,
    
    -- Phân quyền
    CHUCVU ENUM('TO_TRUONG', 'TO_PHO', 'CAN_BO_NGHIEP_VU') NOT NULL,
    
    -- Trạng thái
    TRANGTHAI BOOLEAN DEFAULT TRUE,
    
    -- Bảo mật
    LAN_DANG_NHAP_CUOI TIMESTAMP NULL DEFAULT NULL,
    SO_LAN_DANG_NHAP_SAI INT DEFAULT 0,
    
    -- Metadata
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_trangthai (TRANGTHAI),
    INDEX idx_chucvu (CHUCVU)
) ENGINE=InnoDB COMMENT='Bảng quản lý tài khoản hệ thống';

-- ============================================================
-- 9. BẢNG TÀI SẢN 
-- ============================================================
CREATE TABLE TAI_SAN (
    MATAISAN INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Thông tin tài sản
    TENTAISAN VARCHAR(100) NOT NULL,
    LOAI_TAI_SAN VARCHAR(50) DEFAULT NULL,
    MA_TAI_SAN VARCHAR(30) UNIQUE DEFAULT NULL,
    
    -- Số lượng & Tình trạng
    SOLUONG_TOT INT DEFAULT 0,
    SOLUONG_HONG INT DEFAULT 0,
    DON_VI_TINH VARCHAR(20) DEFAULT 'Cái',
    
    -- Giá trị
    GIA_TRI_MUA DECIMAL(15,2) DEFAULT 0,
    GIA_TRI_HIEN_TAI DECIMAL(15,2) DEFAULT 0,
    
    -- Thông tin mua sắm
    NGAY_MUA DATE DEFAULT NULL,
    NHA_CUNG_CAP VARCHAR(100) DEFAULT NULL,
    
    -- Vị trí lưu trữ
    VI_TRI_LUU_TRU VARCHAR(100) DEFAULT NULL,
    
    -- Metadata
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_loai_taisan (LOAI_TAI_SAN),
    INDEX idx_tentaisan (TENTAISAN)
) ENGINE=InnoDB COMMENT='Bảng quản lý tài sản';

-- ============================================================
-- 10. BẢNG HOẠT ĐỘNG/SỰ KIỆN 
-- ============================================================
CREATE TABLE HOAT_DONG (
    MASUKIEN INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Thông tin sự kiện
    TENSUKIEN VARCHAR(100) NOT NULL,
    MO_TA TEXT DEFAULT NULL,
    
    -- Thời gian
    NGAYBATDAU DATETIME NOT NULL,
    NGAYKETTHUC DATETIME NOT NULL,
    
    -- Phân loại
    LOAISUKIEN ENUM(
        'HopToDanPho',
        'VeSinhMoiTruong',
        'VanHoaGiaiTri',
        'TuThien',
        'HocTap',
        'TheThao',
        'Khac'
    ) NOT NULL,
    
    -- Địa điểm
    DIA_DIEM VARCHAR(200) DEFAULT NULL,
    
    -- Phí & Ngân sách
    PHI_SU_DUNG DECIMAL(12,2) DEFAULT 0,
    NGUON_KINH_PHI VARCHAR(100) DEFAULT NULL,
    
    -- Phê duyệt
    TRANGTHAI_DUYET ENUM('ChoDuyet', 'DaDuyet', 'TuChoi', 'Huy') 
        DEFAULT 'ChoDuyet',
    NGUOI_DUYET INT DEFAULT NULL,
    NGAY_DUYET DATETIME DEFAULT NULL,
    LY_DO_TU_CHOI TEXT DEFAULT NULL,
    
    -- Số người tham gia
    SO_NGUOI_THAM_GIA INT DEFAULT 0,
    
    -- Metadata
    NGUOI_TAO INT DEFAULT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_loaisukien (LOAISUKIEN),
    INDEX idx_trangthai (TRANGTHAI_DUYET),
    INDEX idx_ngaybatdau (NGAYBATDAU),
    
    CONSTRAINT chk_hoatdong_dates CHECK (NGAYKETTHUC >= NGAYBATDAU)
) ENGINE=InnoDB COMMENT='Bảng quản lý hoạt động/sự kiện';

-- ============================================================
-- 11. BẢNG ĐĂNG KÝ THAM GIA HOẠT ĐỘNG
-- ============================================================
CREATE TABLE THAM_GIA_HOAT_DONG (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    MASUKIEN INT NOT NULL,
    MANHANKHAU INT NOT NULL,
    
    NGAY_DANG_KY TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TRANG_THAI ENUM('DaDangKy', 'DaThamGia', 'Vang') DEFAULT 'DaDangKy',
    
    GHICHU TEXT DEFAULT NULL,
    
    FOREIGN KEY (MASUKIEN) REFERENCES HOAT_DONG(MASUKIEN)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (MANHANKHAU) REFERENCES NHAN_KHAU(MANHANKHAU)
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    UNIQUE KEY unique_thamgia (MASUKIEN, MANHANKHAU),
    INDEX idx_masukien (MASUKIEN),
    INDEX idx_manhankhau (MANHANKHAU)
) ENGINE=InnoDB COMMENT='Bảng đăng ký tham gia hoạt động';

-- ============================================================
-- 12. VIEW: Thông tin hộ khẩu đầy đủ
-- ============================================================
CREATE VIEW v_ho_khau_day_du AS
SELECT 
    hk.SOHOKHAU,
    hk.DIACHI,
    hk.HOSOSO,
    hk.SODANGKYSO,
    hk.TOSO,
    hk.NGAYCAP,
    hk.TRANGTHAI AS TRANGTHAI_HO,
    chu_ho.MANHANKHAU AS MA_CHU_HO,
    chu_ho.HOTEN AS TEN_CHU_HO,
    chu_ho.NGAYSINH AS NGAYSINH_CHU_HO,
    chu_ho.CCCD AS CCCD_CHU_HO,
    COUNT(hknk.MANHANKHAU) AS SO_THANH_VIEN,
    hk.CREATED_AT,
    hk.UPDATED_AT
FROM HO_KHAU hk
LEFT JOIN HO_KHAU_NHAN_KHAU hknk_chu ON hk.SOHOKHAU = hknk_chu.SOHOKHAU 
    AND hknk_chu.LA_CHU_HO = TRUE 
    AND hknk_chu.TRANGTHAI = 'DangO'
LEFT JOIN NHAN_KHAU chu_ho ON hknk_chu.MANHANKHAU = chu_ho.MANHANKHAU
LEFT JOIN HO_KHAU_NHAN_KHAU hknk ON hk.SOHOKHAU = hknk.SOHOKHAU 
    AND hknk.TRANGTHAI = 'DangO'
WHERE hk.TRANGTHAI = 'HoatDong'
GROUP BY 
    hk.SOHOKHAU, hk.DIACHI, hk.HOSOSO, hk.SODANGKYSO, hk.TOSO, hk.NGAYCAP,
    hk.TRANGTHAI, chu_ho.MANHANKHAU, chu_ho.HOTEN, chu_ho.NGAYSINH, chu_ho.CCCD,
    hk.CREATED_AT, hk.UPDATED_AT;
-- ============================================================
-- 13. STORED PROCEDURE: Thêm nhân khẩu vào hộ
-- ============================================================
DELIMITER $$
CREATE PROCEDURE sp_them_nhan_khau_vao_ho(
    IN p_manhankhau INT,
    IN p_sohokhau INT,
    IN p_quanhechuho VARCHAR(30),
    IN p_la_chu_ho BOOLEAN,
    IN p_ngay_vao_ho DATE
)
BEGIN
    DECLARE v_cnt INT DEFAULT 0;

    START TRANSACTION;

    -- Khóa các hàng liên quan để tránh race (sử dụng index trên MANHANKHAU và SOHOKHAU)
    SELECT COUNT(*) INTO v_cnt FROM HO_KHAU_NHAN_KHAU
    WHERE MANHANKHAU = p_manhankhau AND TRANGTHAI = 'DangO' FOR UPDATE;

    IF v_cnt > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nhân khẩu đã thuộc hộ khác';
    END IF;

    IF p_la_chu_ho = TRUE THEN
        SELECT COUNT(*) INTO v_cnt FROM HO_KHAU_NHAN_KHAU
        WHERE SOHOKHAU = p_sohokhau AND LA_CHU_HO = TRUE AND TRANGTHAI = 'DangO' FOR UPDATE;

        IF v_cnt > 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hộ khẩu đã có chủ hộ';
        END IF;
    END IF;

    -- Insert an toàn
    INSERT INTO HO_KHAU_NHAN_KHAU (SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO, NGAY_VAO_HO, TRANGTHAI)
    VALUES (p_sohokhau, p_manhankhau, p_quanhechuho, p_la_chu_ho, p_ngay_vao_ho, 'DangO');

    -- Ghi log vào LICH_SU_...
    INSERT INTO LICH_SU_NHAN_KHAU (MANHANKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG, LYDO)
    VALUES (p_manhankhau, 'VaoHo', p_ngay_vao_ho, CONCAT('Gia nhập hộ khẩu số ', p_sohokhau));

    INSERT INTO LICH_SU_HO_KHAU (SOHOKHAU, LOAI_BIEN_DONG, NGAY_BIEN_DONG, MO_TA)
    VALUES (p_sohokhau, 'ThemThanhVien', p_ngay_vao_ho, CONCAT('Thêm nhân khẩu ', p_manhankhau, ' vào hộ'));

    COMMIT;
END$$
DELIMITER ;

-- ============================================================
-- 14. TRIGGER: Tự động ghi log khi cập nhật nhân khẩu
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_nhan_khau_update
AFTER UPDATE ON NHAN_KHAU
FOR EACH ROW
BEGIN
    INSERT INTO LICH_SU_NHAN_KHAU (
        MANHANKHAU,
        LOAI_BIEN_DONG,
        NGAY_BIEN_DONG,
        DU_LIEU_CU,
        DU_LIEU_MOI,
        LYDO
    ) VALUES (
        NEW.MANHANKHAU,
        'CapNhatThongTin',
        CURDATE(),
        JSON_OBJECT(
            'HOTEN', OLD.HOTEN,
            'CCCD', OLD.CCCD,
            'TRANGTHAI', OLD.TRANGTHAI
        ),
        JSON_OBJECT(
            'HOTEN', NEW.HOTEN,
            'CCCD', NEW.CCCD,
            'TRANGTHAI', NEW.TRANGTHAI
        ),
        'Cập nhật thông tin nhân khẩu'
    );
END$$

DELIMITER ;

DELIMITER $$
CREATE TRIGGER bi_HO_KHAU_NHAN_KHAU_before_insert
BEFORE INSERT ON HO_KHAU_NHAN_KHAU
FOR EACH ROW
BEGIN
    -- Nếu thêm với trạng thái DangO, kiểm tra người đã có DangO chưa
    IF NEW.TRANGTHAI = 'DangO' THEN
        IF EXISTS (
            SELECT 1 FROM HO_KHAU_NHAN_KHAU
            WHERE MANHANKHAU = NEW.MANHANKHAU
              AND TRANGTHAI = 'DangO'
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nhân khẩu đã có hộ đang ở (DangO)';
        END IF;
    END IF;

    -- Nếu là chủ hộ và trạng thái DangO, kiểm tra hộ đã có chủ hộ DangO chưa
    IF NEW.LA_CHU_HO = TRUE AND NEW.TRANGTHAI = 'DangO' THEN
        IF EXISTS (
            SELECT 1 FROM HO_KHAU_NHAN_KHAU
            WHERE SOHOKHAU = NEW.SOHOKHAU
              AND LA_CHU_HO = TRUE
              AND TRANGTHAI = 'DangO'
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hộ khẩu đã có chủ hộ đang ở';
        END IF;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER bu_HO_KHAU_NHAN_KHAU_before_update
BEFORE UPDATE ON HO_KHAU_NHAN_KHAU
FOR EACH ROW
BEGIN
    -- Nếu cập nhật thành DangO (từ khác sang DangO)
    IF NEW.TRANGTHAI = 'DangO' AND (OLD.TRANGTHAI <> 'DangO') THEN
        IF EXISTS (
            SELECT 1 FROM HO_KHAU_NHAN_KHAU
            WHERE MANHANKHAU = NEW.MANHANKHAU
              AND TRANGTHAI = 'DangO'
              AND ID <> NEW.ID
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nhân khẩu đã có hộ đang ở (DangO)';
        END IF;
    END IF;

    -- Nếu đổi/đặt LA_CHU_HO = TRUE và TRANGTHAI = 'DangO', kiểm chủ hộ duy nhất
    IF NEW.LA_CHU_HO = TRUE AND NEW.TRANGTHAI = 'DangO' THEN
        IF EXISTS (
            SELECT 1 FROM HO_KHAU_NHAN_KHAU
            WHERE SOHOKHAU = NEW.SOHOKHAU
              AND LA_CHU_HO = TRUE
              AND TRANGTHAI = 'DangO'
              AND ID <> NEW.ID
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hộ khẩu đã có chủ hộ đang ở';
        END IF;
    END IF;
END$$
DELIMITER ;



