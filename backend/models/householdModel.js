const pool = require('../db');

// === Lấy tất cả danh sách hộ khẩu ===
const getAllHousehold = async () => {
  const [rows] = await pool.query(`
    SELECT * FROM HO_KHAU
  `);
  return rows;
};


// === Tìm kiếm hộ khẩu ===
const searchHouseholds = async (query) => {
  const q = String(query).trim();
  const like = `%${q}%`;
  const [rows] = await pool.query(
    'SELECT * FROM HO_KHAU WHERE HOTENCHUHO LIKE ? OR SOHOKHAU = ?',
    [like, q]
  );
  return rows;
};


// === Kiểm tra hộ khẩu tồn tại ===
const isHoKhauTaken = async (hotenchuho, manhankhauchuho) => {
  const [rows] = await pool.query(
    'SELECT SOHOKHAU FROM NHAN_KHAU WHERE HOTEN = ? AND MANHANKHAU = ?',
    [hotenchuho.trim(), manhankhauchuho]
  );
  return rows.length > 0; // true nếu đã tồn tại
};


// === Thêm hộ khẩu mới ===
const addHouseholds = async (hotenchuho, diachi, hososo, sodangkyso, toso) => {
  const [result] = await pool.query(
    'INSERT INTO HO_KHAU (HOTENCHUHO, DIACHI, HOSOSO, SODANGKYSO, TOSO) VALUES (?, ?, ?, ?, ?)',
    [hotenchuho, diachi, hososo, sodangkyso, toso]
  );
  if (result.affectedRows > 0) {
    const [result1] = await pool.query('INSERT INTO THAY_DOI_HO_KHAU (SOHOKHAU, NOIDUNG, NGAYTHAYDOI) VALUES (?, ?, ?)',
      [result.insertId, 'Tạo mới hộ khẩu', new Date()]
    );
  }
  return result;
};

// === Xóa hộ khẩu bằng số hộ khẩu ===
const deleteHouseholds = async (sohokhau) => {


  const [] = await pool.query('INSERT INTO THAY_DOI_HO_KHAU (SOHOKHAU, NOIDUNG, NGAYTHAYDOI) VALUES (?, ?, ?)',
    [sohokhau, 'Xóa hộ khẩu', new Date()]
  );
  const [result] = await pool.query(
    'DELETE FROM HO_KHAU WHERE SOHOKHAU = ?',
    [sohokhau]
  );
  const [] = await pool.query('UPDATE NHAN_KHAU SET SOHOKHAU = NULL WHERE SOHOKHAU = ?',
    [sohokhau]
  );

  return result;
};

// === Cập nhật hộ khẩu bằng số hộ khẩu ===
const updateHouseholds = async (sohokhau, newtenchuho, newdiachi, newhososo, newsodangkyso, newtoso) => {
  const [old] = await pool.query(
    'SELECT * FROM HO_KHAU WHERE SOHOKHAU = ?',
    [sohokhau]
  );
  const oldData = old[0];
  let changes = [];
  const [result] = await pool.query(
    'UPDATE HO_KHAU SET HOTENCHUHO = ?, DIACHI = ?, HOSOSO = ?, SODANGKYSO = ?, TOSO = ? WHERE SOHOKHAU = ?',
    [newtenchuho, newdiachi, newhososo, newsodangkyso, newtoso, sohokhau]
  );
  if (result.changedRows > 0) {
    if (oldData.HOTENCHUHO !== newtenchuho) {
      changes.push(`HOTENCHUHO: '${oldData.HOTENCHUHO}' -> '${newtenchuho}'`);
    }
    if (oldData.DIACHI !== newdiachi) {
      changes.push(`DIACHI: '${oldData.DIACHI}' -> '${newdiachi}'`);
    }
    if (oldData.HOSOSO !== newhososo) {
      changes.push(`HOSOSO: '${oldData.HOSOSO}' -> '${newhososo}'`);
    }
    if (oldData.SODANGKYSO !== newsodangkyso) {
      changes.push(`SODANGKYSO: '${oldData.SODANGKYSO}' -> '${newsodangkyso}'`);
    }
    if (oldData.TOSO !== newtoso) {
      changes.push(`TOSO: '${oldData.TOSO}' -> '${newtoso}'`);
    }
    if (changes.length > 0) {
      const changeLog = changes.join('; ');
      await pool.query('INSERT INTO THAY_DOI_HO_KHAU (SOHOKHAU, NOIDUNG, NGAYTHAYDOI) VALUES (?, ?, ?)', [sohokhau, 'Cập nhật hộ khẩu: ' + changeLog, new Date()]);
    }
  }
  return result;
};

// === Lấy thông tin chi tiết hộ khẩu ===
const getHouseholdDetails = async (sohokhau) => {
  const [rows] = await pool.query(
    'SELECT * FROM NHAN_KHAU WHERE SOHOKHAU = ?',
    [sohokhau]
  );
  return rows;
};

// === Chuyển thành viên sang hộ khẩu mới ===
const moveMembersToNewHousehold = async (manhankhau, newSohokhau) => {
  const [result] = await pool.query(
    'UPDATE NHAN_KHAU SET SOHOKHAU = ? WHERE MANHANKHAU = ?',
    [newSohokhau, manhankhau]
  );
  return result;
};

module.exports = {
  getAllHousehold,
  isHoKhauTaken,
  searchHouseholds,
  addHouseholds,
  getHouseholdDetails,
  deleteHouseholds,
  updateHouseholds,
  moveMembersToNewHousehold,
};