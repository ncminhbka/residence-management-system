-- =========================================
-- INIT DATA FOR myapp DATABASE
-- =========================================

USE myapp;

-- 1. NHAN_KHAU
INSERT INTO NHAN_KHAU 
(SOHOKHAU, HOTEN, BIDANH, NGAYSINH, GIOITINH, NOISINH, NGUYENQUAN, DANTOC, QUOCTICH, NGHENGHIEP, NGAYCAP, NOICAP, QUANHECHUHO, TRANGTHAI, NOITHUONGTRUCU)
VALUES
(NULL, 'Nguyễn Văn A', NULL, '1980-05-12', 'Nam', 'Hà Nội', 'Hà Nội', 'Kinh', 'Việt Nam', 'Công nhân', '2010-04-10', 'CA Hà Nội', 'Chủ hộ', 'Thường trú', '123 Lý Thường Kiệt'),
(NULL, 'Trần Thị B', NULL, '1985-08-25', 'Nữ', 'Hà Nội', 'Hà Nội', 'Kinh', 'Việt Nam', 'Giáo viên', '2011-09-12', 'CA Hà Nội', 'Vợ', 'Thường trú', '123 Lý Thường Kiệt'),
(NULL, 'Nguyễn Văn C', NULL, '2005-03-10', 'Nam', 'Hà Nội', 'Hà Nội', 'Kinh', 'Việt Nam', 'Học sinh', '2021-03-10', 'CA Hà Nội', 'Con', 'Thường trú', '123 Lý Thường Kiệt'),
(NULL, 'Phạm Văn D', NULL, '1975-01-20', 'Nam', 'Đà Nẵng', 'Đà Nẵng', 'Kinh', 'Việt Nam', 'Kỹ sư', '2009-06-01', 'CA Đà Nẵng', 'Chủ hộ', 'Thường trú', '56 Nguyễn Huệ'),
(NULL, 'Lê Thị E', NULL, '1980-07-30', 'Nữ', 'Đà Nẵng', 'Đà Nẵng', 'Kinh', 'Việt Nam', 'Nội trợ', '2010-08-01', 'CA Đà Nẵng', 'Vợ', 'Thường trú', '56 Nguyễn Huệ');


-- 2. HO_KHAU
INSERT INTO HO_KHAU (MACHUHO, DIACHI, HOSOSO, SODANGKYSO, TOSO)
VALUES
(1, '123 Lý Thường Kiệt, Hà Nội', 1001, 501, 1),
(4, '56 Nguyễn Huệ, Đà Nẵng', 1002, 502, 2);


-- 3. UPDATE SOHOKHAU cho nhân khẩu
UPDATE NHAN_KHAU SET SOHOKHAU = 1 WHERE MANHANKHAU IN (1, 2, 3);
UPDATE NHAN_KHAU SET SOHOKHAU = 2 WHERE MANHANKHAU IN (4, 5);


-- 4. TAM_TRU
INSERT INTO TAM_TRU (MANHANKHAU, NGAYBATDAU, NGAYKETTHUC, DIACHITAMTRU, GHICHU)
VALUES
(3, '2024-01-01', '2024-06-30', 'Ký túc xá Đại học Bách Khoa', 'Học tập');


-- 5. TAM_VANG
INSERT INTO TAM_VANG (MANHANKHAU, NGAYBATDAU, NGAYKETTHUC, LYDO, GHICHU)
VALUES
(5, '2024-02-01', '2024-03-15', 'Đi công tác', 'Trong nước');


-- 6. THAY_DOI_NHAN_KHAU
INSERT INTO THAY_DOI_NHAN_KHAU (MANHANKHAU, LOAITHAYDOI, NOICHUYEN, NGAYTHAYDOI)
VALUES
(3, 'Chuyển tạm trú', 'Ký túc xá Đại học Bách Khoa', '2024-01-01');


-- 7. THAY_DOI_HO_KHAU
INSERT INTO THAY_DOI_HO_KHAU (SOHOKHAU, NOIDUNG, NGAYTHAYDOI)
VALUES
(1, 'Thêm thành viên mới', '2024-03-15');


-- 8. TAI_SAN
INSERT INTO TAI_SAN (TENTAISAN, SOLUONG, TINHTRANG)
VALUES
('Loa công cộng', 5, 'Tốt'),
('Bàn ghế hội trường', 50, 'Khá'),
('Máy chiếu', 2, 'Tốt');


-- 9. HOAT_DONG
INSERT INTO HOAT_DONG (TENSUKIEN, NGAYTOCHUC, LOAISUKIEN, PHISUDUNG, TRANGTHAIDUYET)
VALUES
('Hội nghị tổ dân phố', '2024-09-10', 'Sinh hoạt cộng đồng', 0.00, 'Đã duyệt'),
('Tết Trung Thu', '2024-09-28', 'Văn hóa', 200000.00, 'Đã duyệt');



