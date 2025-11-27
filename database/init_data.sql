USE ToDanPho7; 
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================
-- 1. DỮ LIỆU NHÂN KHẨU
-- =========================================
TRUNCATE TABLE NHAN_KHAU;

INSERT INTO NHAN_KHAU 
    (HOTEN, BIDANH, NGAYSINH, GIOITINH, NOISINH, NGUYENQUAN, 
     DANTOC, QUOCTICH, CCCD, NGAYCAP_CCCD, NOICAP_CCCD,
     NGHENGHIEP, NOILAMVIEC, NOITHUONGTRUCU, TRANGTHAI)
VALUES
('Nguyễn Văn Hùng', NULL, '1980-05-12', 'Nam', 'Hà Nội', 'Hà Nội',
 'Kinh', 'Việt Nam', '001080000001', '2021-04-10', 'Cục CS QLHC về TTXH',
 'Kỹ sư xây dựng', 'Công ty Xây dựng A', 'Hà Đông', 'ThuongTru'),

('Trần Thị Mai', NULL, '1982-08-25', 'Nữ', 'Nam Định', 'Nam Định',
 'Kinh', 'Việt Nam', '001082000002', '2021-09-12', 'Cục CS QLHC về TTXH',
 'Giáo viên', 'THCS La Khê', 'Hà Đông', 'ThuongTru'),

('Nguyễn Văn Nam', 'Tèo', '2005-03-10', 'Nam', 'Hà Nội', 'Hà Nội',
 'Kinh', 'Việt Nam', '001205000003', '2023-03-10', 'CA Hà Nội',
 'Sinh viên', 'ĐHBK Hà Nội', 'Hà Đông', 'ThuongTru'),

('Nguyễn Thị Lan', 'Bống', '2012-12-05', 'Nữ', 'Hà Nội', 'Hà Nội',
 'Kinh', 'Việt Nam', NULL, NULL, NULL,
 'Học sinh', 'TH La Khê', 'Hà Đông', 'ThuongTru'),

('Lê Văn Cường', NULL, '1955-01-20', 'Nam', 'Thanh Hóa', 'Thanh Hóa',
 'Kinh', 'Việt Nam', '038055000001', '2015-06-01', 'CA Thanh Hóa',
 'Cán bộ hưu trí', 'Đã nghỉ hưu', 'Hà Đông', 'ThuongTru'),

('Lê Văn Thắng', NULL, '1985-02-15', 'Nam', 'Thanh Hóa', 'Thanh Hóa',
 'Kinh', 'Việt Nam', '038085000002', '2020-01-20', 'Cục CS QLHC về TTXH',
 'NV Ngân hàng', 'ACB', 'Hà Đông', 'ThuongTru'),

('Phạm Thị Hương', NULL, '1990-07-30', 'Nữ', 'Hà Tĩnh', 'Hà Tĩnh',
 'Kinh', 'Việt Nam', '038090000003', '2020-08-01', 'Cục CS QLHC về TTXH',
 'Kế toán', 'Siêu thị Aeon', 'Hà Đông', 'ThuongTru'),

('Lê Gia Bảo', 'Bi', '2018-11-11', 'Nam', 'Hà Nội', 'Thanh Hóa',
 'Kinh', 'Việt Nam', NULL, NULL, NULL,
 'Trẻ em', 'Mầm non Hoa Hồng', 'Hà Đông', 'ThuongTru'),

('Hoàng Văn Thái', NULL, '1995-06-15', 'Nam', 'Nghệ An', 'Nghệ An',
 'Kinh', 'Việt Nam', '040095000001', '2021-05-05', 'Cục CS QLHC về TTXH',
 'Lập trình viên', 'FPT', 'Hà Đông', 'ThuongTru'),

('Nguyễn Thu Trang', NULL, '1998-09-20', 'Nữ', 'Bắc Ninh', 'Bắc Ninh',
 'Kinh', 'Việt Nam', '040098000002', '2021-10-10', 'Cục CS QLHC về TTXH',
 'Designer', 'Freelancer', 'Hà Đông', 'TamVang'),

('Nguyễn Văn Cụ', NULL, '1930-01-01', 'Nam', 'Hà Nội', 'Hà Nội',
 'Kinh', 'Việt Nam', '001030000000', '2000-01-01', 'CA Hà Nội',
 'Hưu trí', 'Không', 'Hà Đông', 'DaQuaDoi'),

('Trần Văn Tí', NULL, '1990-01-01', 'Nam', 'Hà Nội', 'Hà Nội',
 'Kinh', 'Việt Nam', '001090000099', '2015-01-01', 'CA Hà Nội',
 'Kinh doanh', 'TP HCM', 'TP HCM', 'ChuyenDi'),

('Trịnh Công Sơn', NULL, '2000-04-30', 'Nam', 'Huế', 'Huế',
 'Kinh', 'Việt Nam', '075200000001', '2018-04-30', 'CA Huế',
 'Sinh viên', 'ĐH Kiến Trúc', 'Hà Đông', 'TamTru'),

('Phan Văn Khải', NULL, '2000-12-12', 'Nam', 'Đà Nẵng', 'Đà Nẵng',
 'Kinh', 'Việt Nam', '048200000002', '2018-12-12', 'CA Đà Nẵng',
 'Sinh viên', 'ĐH Kiến Trúc', 'Hà Đông', 'TamTru');


-- =========================================
-- 2. DỮ LIỆU HỘ KHẨU
-- =========================================
TRUNCATE TABLE HO_KHAU;

INSERT INTO HO_KHAU (DIACHI, HOSOSO, SODANGKYSO, TOSO, NGAYCAP, TRANGTHAI)
VALUES
('Số 1 Ngõ 5 La Khê', 1001, 501, 1, '2018-01-15', 'HoatDong'),
('Số 18 Tố Hữu La Khê', 1002, 502, 1, '2019-03-20', 'HoatDong'),
('Số 5 Ngách 12 Ngõ 3 La Khê', 1003, 503, 2, '2015-10-10', 'HoatDong'),
('Chung cư ParkCity La Khê', 1004, 504, 2, '2022-06-01', 'HoatDong');


-- =========================================
-- 3. QUAN HỆ HỘ KHẨU – NHÂN KHẨU
-- =========================================
TRUNCATE TABLE HO_KHAU_NHAN_KHAU;

-- Hộ 1
INSERT INTO HO_KHAU_NHAN_KHAU (SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO, NGAY_VAO_HO)
VALUES
(1, 1, 'Chủ hộ', TRUE, '2018-01-15'),
(1, 2, 'Vợ', FALSE, '2018-01-15'),
(1, 3, 'Con', FALSE, '2018-01-15'),
(1, 4, 'Con', FALSE, '2018-01-15');

-- Hộ 2
INSERT INTO HO_KHAU_NHAN_KHAU (SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO, NGAY_VAO_HO)
VALUES
(2, 5, 'Chủ hộ', TRUE, '2019-03-20'),
(2, 6, 'Con', FALSE, '2019-03-20'),
(2, 7, 'Con dâu', FALSE, '2019-03-20'),
(2, 8, 'Cháu', FALSE, '2019-03-20');

-- Hộ 3
INSERT INTO HO_KHAU_NHAN_KHAU (SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO, NGAY_VAO_HO)
VALUES
(3, 9, 'Chủ hộ', TRUE, '2015-10-10'),
(3, 10, 'Vợ', FALSE, '2015-10-10');

-- Hộ 4
INSERT INTO HO_KHAU_NHAN_KHAU (SOHOKHAU, MANHANKHAU, QUANHECHUHO, LA_CHU_HO, NGAY_VAO_HO)
VALUES
(4, 13, 'Chủ hộ', TRUE, '2022-06-01'),
(4, 14, 'Bạn bè', FALSE, '2022-06-01');


-- =========================================
-- 4. DỮ LIỆU TẠM TRÚ
-- =========================================
TRUNCATE TABLE TAM_TRU;

INSERT INTO TAM_TRU (MANHANKHAU, MAGIAYTAMTRU, NGAYBATDAU, NGAYKETTHUC, DIACHITAMTRU, GHICHU)
VALUES
(13, 'TT001', '2023-09-01', '2024-09-01', 'ParkCity La Khê', 'Sinh viên thuê trọ'),
(14, 'TT002', '2023-09-01', '2024-09-01', 'ParkCity La Khê', 'Ở ghép');


-- =========================================
-- 5. DỮ LIỆU TẠM VẮNG
-- =========================================
TRUNCATE TABLE TAM_VANG;

INSERT INTO TAM_VANG (MANHANKHAU, MAGIAYTAMVANG, NGAYBATDAU, NGAYKETTHUC, NOITAMTRU, LYDO)
VALUES
(10, 'TV001', '2024-01-01', '2024-06-30', 'TP.HCM', 'Đi công tác');


SET FOREIGN_KEY_CHECKS = 1;