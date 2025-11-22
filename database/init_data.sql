USE ToDanPho7;

-- Tắt kiểm tra khóa ngoại để tránh lỗi khi insert dữ liệu có quan hệ vòng (Hộ khẩu <-> Nhân khẩu)
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================
-- 1. INIT DATA CHO HỘ KHẨU (4 Hộ)
-- =========================================
TRUNCATE TABLE HO_KHAU;
INSERT INTO HO_KHAU (SOHOKHAU, MACHUHO, DIACHI, HOSOSO, SODANGKYSO, TOSO, NGAYCAP, DELETE_FLAG) VALUES
(1, 1, 'Số 1, Ngõ 5, Đường Lê Trọng Tấn, La Khê', 1001, 501, 1, '2018-01-15', FALSE),
(2, 5, 'Số 18, Đường Tố Hữu, La Khê', 1002, 502, 1, '2019-03-20', FALSE),
(3, 9, 'Số 5, Ngách 12, Ngõ 3, La Khê', 1003, 503, 2, '2015-10-10', FALSE),
(4, 13, 'Phòng 302, Chung cư ParkCity, La Khê', 1004, 504, 2, '2022-06-01', FALSE);

-- =========================================
-- 2. INIT DATA CHO NHÂN KHẨU (15 Người)
-- =========================================
TRUNCATE TABLE NHAN_KHAU;

-- HỘ 1: Gia đình chuẩn (Bố mẹ + 2 con)
INSERT INTO NHAN_KHAU (MANHANKHAU, SOHOKHAU, HOTEN, BIDANH, NGAYSINH, GIOITINH, NOISINH, NGUYENQUAN, DANTOC, QUOCTICH, CCCD, NOILAMVIEC, NGHENGHIEP, NGAYCAP, NOICAP, QUANHECHUHO, TRANGTHAI, NOITHUONGTRUCU) VALUES
(1, 1, 'Nguyễn Văn Hùng', NULL, '1980-05-12', 'Nam', 'Hà Nội', 'Hà Nội', 'Kinh', 'Việt Nam', '001080000001', 'Công ty Xây dựng A', 'Kỹ sư xây dựng', '2021-04-10', 'Cục CS QLHC về TTXH', 'Chủ hộ', 'ThuongTru', 'Số 1, Ngõ 5, Đường Lê Trọng Tấn, La Khê'),
(2, 1, 'Trần Thị Mai', NULL, '1982-08-25', 'Nữ', 'Nam Định', 'Nam Định', 'Kinh', 'Việt Nam', '001082000002', 'Trường THCS La Khê', 'Giáo viên', '2021-09-12', 'Cục CS QLHC về TTXH', 'Vợ', 'ThuongTru', 'Số 1, Ngõ 5, Đường Lê Trọng Tấn, La Khê'),
(3, 1, 'Nguyễn Văn Nam', 'Tèo', '2005-03-10', 'Nam', 'Hà Nội', 'Hà Nội', 'Kinh', 'Việt Nam', '001205000003', 'Đại học Bách Khoa', 'Sinh viên', '2023-03-10', 'CA Hà Nội', 'Con', 'ThuongTru', 'Số 1, Ngõ 5, Đường Lê Trọng Tấn, La Khê'),
(4, 1, 'Nguyễn Thị Lan', 'Bống', '2012-12-05', 'Nữ', 'Hà Nội', 'Hà Nội', 'Kinh', 'Việt Nam', NULL, 'Trường Tiểu học La Khê', 'Học sinh', NULL, NULL, 'Con', 'ThuongTru', 'Số 1, Ngõ 5, Đường Lê Trọng Tấn, La Khê');

-- HỘ 2: Gia đình 3 thế hệ (Ông + Bố mẹ + Cháu)
INSERT INTO NHAN_KHAU (MANHANKHAU, SOHOKHAU, HOTEN, BIDANH, NGAYSINH, GIOITINH, NOISINH, NGUYENQUAN, DANTOC, QUOCTICH, CCCD, NOILAMVIEC, NGHENGHIEP, NGAYCAP, NOICAP, QUANHECHUHO, TRANGTHAI, NOITHUONGTRUCU) VALUES
(5, 2, 'Lê Văn Cường', NULL, '1955-01-20', 'Nam', 'Thanh Hóa', 'Thanh Hóa', 'Kinh', 'Việt Nam', '038055000001', 'Đã nghỉ hưu', 'Cán bộ hưu trí', '2015-06-01', 'CA Thanh Hóa', 'Chủ hộ', 'ThuongTru', 'Số 18, Đường Tố Hữu, La Khê'),
(6, 2, 'Lê Văn Thắng', NULL, '1985-02-15', 'Nam', 'Thanh Hóa', 'Thanh Hóa', 'Kinh', 'Việt Nam', '038085000002', 'Ngân hàng ACB', 'Nhân viên ngân hàng', '2020-01-20', 'Cục CS QLHC về TTXH', 'Con', 'ThuongTru', 'Số 18, Đường Tố Hữu, La Khê'),
(7, 2, 'Phạm Thị Hương', NULL, '1990-07-30', 'Nữ', 'Hà Tĩnh', 'Hà Tĩnh', 'Kinh', 'Việt Nam', '038090000003', 'Siêu thị Aeon Mall', 'Kế toán', '2020-08-01', 'Cục CS QLHC về TTXH', 'Con dâu', 'ThuongTru', 'Số 18, Đường Tố Hữu, La Khê'),
(8, 2, 'Lê Gia Bảo', 'Bi', '2018-11-11', 'Nam', 'Hà Nội', 'Thanh Hóa', 'Kinh', 'Việt Nam', NULL, 'Mầm non Hoa Hồng', 'Trẻ em', NULL, NULL, 'Cháu', 'ThuongTru', 'Số 18, Đường Tố Hữu, La Khê');

-- HỘ 3: Vợ chồng trẻ mới chuyển đến
INSERT INTO NHAN_KHAU (MANHANKHAU, SOHOKHAU, HOTEN, BIDANH, NGAYSINH, GIOITINH, NOISINH, NGUYENQUAN, DANTOC, QUOCTICH, CCCD, NOILAMVIEC, NGHENGHIEP, NGAYCAP, NOICAP, QUANHECHUHO, TRANGTHAI, NOITHUONGTRUCU) VALUES
(9, 3, 'Hoàng Văn Thái', NULL, '1995-06-15', 'Nam', 'Nghệ An', 'Nghệ An', 'Kinh', 'Việt Nam', '040095000001', 'Công ty IT FPT', 'Lập trình viên', '2021-05-05', 'Cục CS QLHC về TTXH', 'Chủ hộ', 'ThuongTru', 'Số 5, Ngách 12, Ngõ 3, La Khê'),
(10, 3, 'Nguyễn Thu Trang', NULL, '1998-09-20', 'Nữ', 'Bắc Ninh', 'Bắc Ninh', 'Kinh', 'Việt Nam', '040098000002', 'Freelancer', 'Thiết kế đồ họa', '2021-10-10', 'Cục CS QLHC về TTXH', 'Vợ', 'TamVang', 'Số 5, Ngách 12, Ngõ 3, La Khê'); -- Vợ đang tạm vắng

-- HỘ 4: Sinh viên/Người đi làm thuê trọ (Đăng ký tạm trú nhưng vẫn có record nhân khẩu)
INSERT INTO NHAN_KHAU (MANHANKHAU, SOHOKHAU, HOTEN, BIDANH, NGAYSINH, GIOITINH, NOISINH, NGUYENQUAN, DANTOC, QUOCTICH, CCCD, NOILAMVIEC, NGHENGHIEP, NGAYCAP, NOICAP, QUANHECHUHO, TRANGTHAI, NOITHUONGTRUCU) VALUES
(13, 4, 'Trịnh Công Sơn', NULL, '2000-04-30', 'Nam', 'Huế', 'Huế', 'Kinh', 'Việt Nam', '075200000001', 'Đại học Kiến Trúc', 'Sinh viên', '2018-04-30', 'CA Huế', 'Chủ hộ', 'TamTru', 'Phòng 302, Chung cư ParkCity, La Khê'),
(14, 4, 'Phan Văn Khải', NULL, '2000-12-12', 'Nam', 'Đà Nẵng', 'Đà Nẵng', 'Kinh', 'Việt Nam', '048200000002', 'Đại học Kiến Trúc', 'Sinh viên', '2018-12-12', 'CA Đà Nẵng', 'Bạn bè', 'TamTru', 'Phòng 302, Chung cư ParkCity, La Khê');

-- NHÂN KHẨU ĐÃ MẤT HOẶC CHUYỂN ĐI (Để test lịch sử)
INSERT INTO NHAN_KHAU (MANHANKHAU, SOHOKHAU, HOTEN, BIDANH, NGAYSINH, GIOITINH, NOISINH, NGUYENQUAN, DANTOC, QUOCTICH, CCCD, NOILAMVIEC, NGHENGHIEP, NGAYCAP, NOICAP, QUANHECHUHO, TRANGTHAI, NOITHUONGTRUCU) VALUES
(11, 1, 'Nguyễn Văn Cụ', NULL, '1930-01-01', 'Nam', 'Hà Nội', 'Hà Nội', 'Kinh', 'Việt Nam', '001030000000', 'Không', 'Đã nghỉ hưu', '2000-01-01', 'CA Hà Nội', 'Bố', 'DaQuaDoi', 'Số 1, Ngõ 5, Đường Lê Trọng Tấn, La Khê'),
(12, NULL, 'Trần Văn Tí', NULL, '1990-01-01', 'Nam', 'Hà Nội', 'Hà Nội', 'Kinh', 'Việt Nam', '001090000099', 'TP HCM', 'Kinh doanh', '2015-01-01', 'CA Hà Nội', 'Không', 'ChuyenDi', 'Đã chuyển đi TP HCM');


-- =========================================
-- 3. DATA CHO TẠM TRÚ (Các sinh viên ở Hộ 4)
-- =========================================
TRUNCATE TABLE TAM_TRU;
INSERT INTO TAM_TRU (MANHANKHAU, MAGIAYTAMTRU, NGAYBATDAU, NGAYKETTHUC, DIACHITAMTRU, GHICHU) VALUES
(13, 'TT001', '2023-09-01', '2024-09-01', 'Phòng 302, Chung cư ParkCity, La Khê', 'Sinh viên thuê nhà'),
(14, 'TT002', '2023-09-01', '2024-09-01', 'Phòng 302, Chung cư ParkCity, La Khê', 'Sinh viên thuê nhà ở ghép');

-- =========================================
-- 4. DATA CHO TẠM VẮNG (Vợ ở Hộ 3)
-- =========================================
TRUNCATE TABLE TAM_VANG;
INSERT INTO TAM_VANG (MANHANKHAU, MAGIAYTAMVANG, NGAYBATDAU, NGAYKETTHUC, NOITAMTRU, LYDO, GHICHU) VALUES
(10, 'TV001', '2024-01-01', '2024-06-30', 'Quận 1, TP Hồ Chí Minh', 'Đi công tác dài hạn', 'Dự án công ty');

-- =========================================
-- 5. LỊCH SỬ THAY ĐỔI NHÂN KHẨU
-- =========================================
TRUNCATE TABLE THAY_DOI_NHAN_KHAU;
INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NOICHUYEN, NGAYTHAYDOI, GHICHU) VALUES
(11, 'Tu', NULL, '2023-12-20', 'Qua đời do tuổi già'),
(12, 'ChuyenDi', 'Quận Bình Thạnh, TP HCM', '2023-11-15', 'Chuyển công tác'),
(3, 'ThayDoiThongTin', NULL, '2023-03-11', 'Cập nhật số CCCD mới');

-- =========================================
-- 6. LỊCH SỬ THAY ĐỔI HỘ KHẨU
-- =========================================
TRUNCATE TABLE THAY_DOI_HO_KHAU;
INSERT INTO THAY_DOI_HO_KHAU (SOHOKHAU, LOAITHAYDOI, NOIDUNG, NGAYTHAYDOI) VALUES
(1, 'ThayDoiThanhVien', 'Khai tử cho ông Nguyễn Văn Cụ', '2023-12-25'),
(3, 'NhapHo', 'Nhập khẩu cho vợ Nguyễn Thu Trang', '2022-01-10');

-- =========================================
-- 7. TÀI SẢN
-- =========================================
TRUNCATE TABLE TAI_SAN;
INSERT INTO TAI_SAN (TENTAISAN, SOLUONG, TINHTRANG, GIATRI) VALUES
('Loa phát thanh phường', 10, 'Tốt', 5000000),
('Bàn ghế nhà văn hóa', 50, 'Khá', 15000000),
('Máy chiếu Sony', 1, 'Tốt', 8000000),
('Tủ sách cộng đồng', 2, 'Tốt', 3000000);

-- =========================================
-- 8. HOẠT ĐỘNG
-- =========================================
TRUNCATE TABLE HOAT_DONG;
INSERT INTO HOAT_DONG (TENSUKIEN, NGAYTOCHUC, LOAISUKIEN, PHISUDUNG, TRANGTHAIDUYET) VALUES
('Họp tổ dân phố quý 1', '2024-03-10', 'Họp định kỳ', 0.00, 'DaDuyet'),
('Tết Thiếu Nhi 1/6', '2024-06-01', 'Văn hóa - Giải trí', 5000000.00, 'DaDuyet'),
('Tổng vệ sinh khu phố', '2024-04-30', 'Vệ sinh môi trường', 1000000.00, 'DaDuyet'),
('Quyên góp ủng hộ bão lụt', '2024-09-15', 'Từ thiện', 0.00, 'DangDienRa');



-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;