const pool = require('../db');

// === Lấy tất cả danh sách hộ khẩu (kèm tên chủ hộ) ===
const getAllHousehold = async () => {
  const [rows] = await pool.query(`
    SELECT hk.SOHOKHAU, hk.MACHUHO, nk.HOTEN AS HOTENCHUHO,
       hk.DIACHI, hk.HOSOSO, hk.SODANGKYSO, hk.TOSO
      FROM HO_KHAU hk
      LEFT JOIN NHAN_KHAU nk ON hk.MACHUHO = nk.MANHANKHAU
      WHERE hk.DELETE_FLAG = FALSE
      ORDER BY hk.SOHOKHAU ASC;
  `);
  return rows;
};

// === Tìm kiếm hộ khẩu theo tên chủ hộ hoặc số hộ khẩu ===
const searchHouseholds = async (query) => {
  const q = String(query).trim();
  const like = `%${q}%`;
  const [rows] = await pool.query(`
    SELECT hk.SOHOKHAU, hk.MACHUHO, nk.HOTEN AS HOTENCHUHO,
           hk.DIACHI, hk.HOSOSO, hk.SODANGKYSO, hk.TOSO
    FROM HO_KHAU hk
    LEFT JOIN NHAN_KHAU nk ON hk.MACHUHO = nk.MANHANKHAU
    WHERE hk.DELETE_FLAG = FALSE
    AND (nk.HOTEN LIKE ? OR hk.SOHOKHAU = ?)
  `, [like, q]);
  return rows;
};

// === Kiểm tra nhân khẩu có tồn tại để làm chủ hộ không ===
const isHoKhauTaken = async (maChuHo) => {
  const [rows] = await pool.query(
    'SELECT * FROM HO_KHAU WHERE MACHUHO = ? AND DELETE_FLAG = FALSE',
    [maChuHo]
  );
  return rows.length > 0; // true = người này đã đứng tên hộ khẩu khác
};


// === Thêm hộ khẩu mới ===
const addHouseholds = async (maChuHo, diachi, hososo, sodangkyso, toso) => {
  const [result] = await pool.query(
    'INSERT INTO HO_KHAU (MACHUHO, DIACHI, HOSOSO, SODANGKYSO, TOSO) VALUES (?, ?, ?, ?, ?)',
    [maChuHo, diachi, hososo, sodangkyso, toso]
  );

  if (result.affectedRows > 0) {
    await pool.query(
      'INSERT INTO THAY_DOI_HO_KHAU (SOHOKHAU, NOIDUNG, NGAYTHAYDOI) VALUES (?, ?, ?)',
      [result.insertId, 'Tạo mới hộ khẩu', new Date()]
    );
  }

  return result;
};

// === Xóa hộ khẩu ===
const deleteHouseholds = async (sohokhau) => {
    const connection = await pool.getConnection(); 
  try {
    await connection.beginTransaction();

    // Ghi lịch sử thay đổi hộ khẩu
    await connection.query(
      `INSERT INTO THAY_DOI_HO_KHAU (SOHOKHAU, NOIDUNG, NGAYTHAYDOI)
       VALUES (?, ?, ?)`,
      [sohokhau, 'Xóa hộ khẩu', new Date()]
    );

    // Bỏ liên kết nhân khẩu thuộc hộ này (tránh vi phạm khóa ngoại)
    await connection.query(
      `UPDATE NHAN_KHAU SET SOHOKHAU = NULL WHERE SOHOKHAU = ?`,
      [sohokhau]
    );

    // Xóa hộ khẩu
    const [result] = await connection.query(
      `UPDATE HO_KHAU SET DELETE_FLAG = TRUE WHERE SOHOKHAU = ?`,
      [sohokhau]
    );

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi xóa hộ khẩu:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// === Cập nhật hộ khẩu ===
const updateHouseholds = async (sohokhau, newMaChuHo, newDiaChi, newHosoSo, newSoDangKySo, newToSo) => {
  const [old] = await pool.query('SELECT * FROM HO_KHAU WHERE SOHOKHAU = ?', [sohokhau]);
  const oldData = old[0];
  let changes = [];

  const [result] = await pool.query(`
    UPDATE HO_KHAU
    SET MACHUHO = ?, DIACHI = ?, HOSOSO = ?, SODANGKYSO = ?, TOSO = ?
    WHERE SOHOKHAU = ?
  `, [newMaChuHo, newDiaChi, newHosoSo, newSoDangKySo, newToSo, sohokhau]);

  if (result.changedRows > 0) {
    if (oldData.MACHUHO !== newMaChuHo)
      changes.push(`MACHUHO: '${oldData.MACHUHO}' -> '${newMaChuHo}'`);
    if (oldData.DIACHI !== newDiaChi)
      changes.push(`DIACHI: '${oldData.DIACHI}' -> '${newDiaChi}'`);
    if (oldData.HOSOSO !== newHosoSo)
      changes.push(`HOSOSO: '${oldData.HOSOSO}' -> '${newHosoSo}'`);
    if (oldData.SODANGKYSO !== newSoDangKySo)
      changes.push(`SODANGKYSO: '${oldData.SODANGKYSO}' -> '${newSoDangKySo}'`);
    if (oldData.TOSO !== newToSo)
      changes.push(`TOSO: '${oldData.TOSO}' -> '${newToSo}'`);

    if (changes.length > 0) {
      const changeLog = changes.join('; ');
      await pool.query(
        'INSERT INTO THAY_DOI_HO_KHAU (SOHOKHAU, NOIDUNG, NGAYTHAYDOI) VALUES (?, ?, ?)',
        [sohokhau, 'Cập nhật hộ khẩu: ' + changeLog, new Date()]
      );
    }
  }

  return result;
};

// === Lấy danh sách nhân khẩu trong hộ khẩu ===
const getHouseholdDetails = async (sohokhau) => {
  const [rows] = await pool.query(
    'SELECT * FROM NHAN_KHAU WHERE SOHOKHAU = ? AND DELETE_FLAG = FALSE',
    [sohokhau]
  );
  return rows;
};

// === Chuyển nhân khẩu sang hộ khẩu khác ===
const moveMembersToNewHousehold = async (members, newSohokhau) => {
  if (!Array.isArray(members) || members.length === 0) return { affectedRows: 0 };
  const [result] = await pool.query(
    `UPDATE NHAN_KHAU SET SOHOKHAU = ? WHERE MANHANKHAU IN (${members.map(() => '?').join(',')})`,
    [newSohokhau, ...members]
  );
  return result;
};


module.exports = {
  getAllHousehold,
  searchHouseholds,
  isHoKhauTaken,
  addHouseholds,
  deleteHouseholds,
  updateHouseholds,
  getHouseholdDetails,
  moveMembersToNewHousehold
};
