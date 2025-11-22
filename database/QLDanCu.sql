DROP DATABASE IF EXISTS ToDanPho7;
-- Sử dụng utf8mb4 để hỗ trợ tiếng Việt đầy đủ nhất (kể cả emoji, ký tự lạ)
CREATE DATABASE ToDanPho7 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ToDanPho7;

-- --------------------------------------------------------
-- 1. BẢNG HỘ KHẨU
-- (Tạo trước nhưng chưa thêm khóa ngoại MACHUHO ngay để tránh lỗi vòng lặp)
-- --------------------------------------------------------
CREATE TABLE HO_KHAU (
    SOHOKHAU INT AUTO_INCREMENT PRIMARY KEY,
    MACHUHO INT, -- Sẽ alter add foreign key sau
    DIACHI VARCHAR(100) NOT NULL,
    HOSOSO INT,
    SODANGKYSO INT,
    TOSO INT,
    NGAYCAP DATE, -- Thêm ngày cấp sổ để quản lý
    DELETE_FLAG BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 2. BẢNG NHÂN KHẨU
-- --------------------------------------------------------
CREATE TABLE NHAN_KHAU (
    MANHANKHAU INT AUTO_INCREMENT PRIMARY KEY,
    SOHOKHAU INT, 
    
    HOTEN VARCHAR(100) NOT NULL,
    BIDANH VARCHAR(50) DEFAULT NULL,
    NGAYSINH DATE NOT NULL,
    GIOITINH VARCHAR(10) NOT NULL,
    NOISINH VARCHAR(100) NOT NULL,
    NGUYENQUAN VARCHAR(100) NOT NULL,
    DANTOC VARCHAR(30) DEFAULT 'Kinh',
    QUOCTICH VARCHAR(20) DEFAULT 'Việt Nam',
    
    -- [CASE STUDY UPDATE] Thêm 2 trường đề bài yêu cầu
    CCCD VARCHAR(20) UNIQUE, -- Số CMND/CCCD (Không thể thiếu)
    NOILAMVIEC VARCHAR(100), -- Đề bài yêu cầu quản lý nơi làm việc
    
    NGHENGHIEP VARCHAR(50),
    NGAYCAP DATE,      -- Ngày cấp CCCD
    NOICAP VARCHAR(100), -- Nơi cấp CCCD
    
    QUANHECHUHO VARCHAR(30) DEFAULT NULL, -- Chủ hộ, Vợ, Con...
    
    -- TRANGTHAI: 'ThuongTru', 'TamTru', 'TamVang', 'DaQuaDoi', 'ChuyenDi'
    TRANGTHAI VARCHAR(50) NOT NULL DEFAULT 'ThuongTru', 
    NOITHUONGTRUCU VARCHAR(100),
    
    -- Tạo khóa ngoại ngay tại đây
    FOREIGN KEY (SOHOKHAU) REFERENCES HO_KHAU(SOHOKHAU)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- CẬP NHẬT KHÓA NGOẠI CHO HỘ KHẨU
-- (Bây giờ bảng NHAN_KHAU đã có, ta mới link MACHUHO được)
-- --------------------------------------------------------
ALTER TABLE HO_KHAU
ADD CONSTRAINT FK_HO_KHAU_CHU_HO
FOREIGN KEY (MACHUHO) REFERENCES NHAN_KHAU(MANHANKHAU);

-- --------------------------------------------------------
-- 3. BẢNG TẠM TRÚ
-- --------------------------------------------------------
CREATE TABLE TAM_TRU (
    MATAMTRU INT AUTO_INCREMENT PRIMARY KEY,
    MANHANKHAU INT NOT NULL,
    MAGIAYTAMTRU VARCHAR(20), -- Mã giấy tạm trú (nếu cần quản lý giấy tờ)
    NGAYBATDAU DATE NOT NULL,
    NGAYKETTHUC DATE NOT NULL,
    DIACHITAMTRU VARCHAR(200) NOT NULL,
    GHICHU VARCHAR(255),
    FOREIGN KEY (MANHANKHAU) REFERENCES NHAN_KHAU(MANHANKHAU)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 4. BẢNG TẠM VẮNG
-- --------------------------------------------------------
CREATE TABLE TAM_VANG (
    MATAMVANG INT AUTO_INCREMENT PRIMARY KEY,
    MANHANKHAU INT NOT NULL,
    MAGIAYTAMVANG VARCHAR(20),
    NGAYBATDAU DATE NOT NULL,
    NGAYKETTHUC DATE NOT NULL,
    NOITAMTRU VARCHAR(200), -- Nơi người này đến tạm trú (Logic hơn LYDO)
    LYDO VARCHAR(100),
    GHICHU VARCHAR(100),
    FOREIGN KEY (MANHANKHAU) REFERENCES NHAN_KHAU(MANHANKHAU)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 5. BẢNG THAY ĐỔI NHÂN KHẨU (LOG)
-- --------------------------------------------------------
CREATE TABLE THAY_DOI_NHAN_KHAU (
    MATDNK INT AUTO_INCREMENT PRIMARY KEY,
    MANHANKHAU INT NOT NULL,
    -- LOAITHAYDOI: 'Sinh', 'Tu', 'ChuyenDi', 'ThayDoiThongTin'
    LOAITHAYDOI VARCHAR(50) NOT NULL, 
    NOICHUYEN VARCHAR(100),
    NGAYTHAYDOI DATE DEFAULT (CURRENT_DATE),
    GHICHU VARCHAR(255),
    FOREIGN KEY (MANHANKHAU) REFERENCES NHAN_KHAU(MANHANKHAU)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 6. BẢNG THAY ĐỔI HỘ KHẨU (LOG)
-- --------------------------------------------------------
CREATE TABLE THAY_DOI_HO_KHAU (
    MATDKH INT AUTO_INCREMENT PRIMARY KEY,
    SOHOKHAU INT NOT NULL,
    -- LOAITHAYDOI: 'TachHo', 'ChuyenChuHo'
    LOAITHAYDOI VARCHAR(50), 
    NOIDUNG VARCHAR(255),
    NGAYTHAYDOI DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (SOHOKHAU) REFERENCES HO_KHAU(SOHOKHAU)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 7. BẢNG TÀI SẢN (Phục vụ quản lý nhà văn hóa...)
-- --------------------------------------------------------
CREATE TABLE TAI_SAN (
    MATAISAN INT AUTO_INCREMENT PRIMARY KEY,
    TENTAISAN VARCHAR(100) NOT NULL,
    SOLUONG INT DEFAULT 0,
    TINHTRANG VARCHAR(50) NOT NULL, -- Tốt, Hỏng...
    GIATRI DECIMAL(15,2) -- Giá trị tài sản (nên có)
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 8. BẢNG HOẠT ĐỘNG (Sự kiện, Thu phí...)
-- --------------------------------------------------------
CREATE TABLE HOAT_DONG (
    MASUKIEN INT AUTO_INCREMENT PRIMARY KEY,
    TENSUKIEN VARCHAR(100) NOT NULL,
    NGAYTOCHUC DATE NOT NULL,
    LOAISUKIEN VARCHAR(100), -- Họp tổ dân phố, Vệ sinh, Từ thiện...
    PHISUDUNG DECIMAL(12,2) DEFAULT 0,
    TRANGTHAIDUYET VARCHAR(50) NOT NULL -- 'ChoDuyet', 'DaDuyet', 'TuChoi'
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- 9. BẢNG TÀI KHOẢN (Login)
-- --------------------------------------------------------
CREATE TABLE TAI_KHOAN (
    MATAIKHOAN INT AUTO_INCREMENT PRIMARY KEY,
    HOTEN VARCHAR(100) NOT NULL,
    CHUCVU VARCHAR(50) NOT NULL, -- ToTruong, ToPho, CanBo
    TENDANGNHAP VARCHAR(50) UNIQUE NOT NULL,
    MATKHAU VARCHAR(255) NOT NULL,
    TRANGTHAI BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;