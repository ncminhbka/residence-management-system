// frontend/assets/js/reports.js

const API_ROOT = '/api/v1';
let currentChart = null;

document.addEventListener('DOMContentLoaded', () => {
    // Gắn sự kiện nút bấm
    document.getElementById('btnViewReport').addEventListener('click', onViewReport);
    document.getElementById('btnExportExcel').addEventListener('click', onExportExcel);
    document.getElementById('btnExportPdf').addEventListener('click', onExportPdf);

    // Xử lý sự kiện thay đổi loại báo cáo
    const reportTypeSelect = document.getElementById('reportType');
    
    reportTypeSelect.addEventListener('change', () => {
        renderReportTitle();
        toggleFilterInputs(); 
    });

    // Hàm ẩn/hiện input dựa trên loại báo cáo
    function toggleFilterInputs() {
        const type = reportTypeSelect.value;
        const dateContainer = document.getElementById('dateRangeContainer');
        const yearContainer = document.getElementById('yearInputContainer');

        if (type === 'dansotheothang') {
            dateContainer.style.display = 'none';
            yearContainer.style.display = 'block';
        } else {
            dateContainer.style.display = 'contents';
            yearContainer.style.display = 'none';
        }
    }

    // Khởi tạo lần đầu
    renderReportTitle();
    toggleFilterInputs();
});

function renderReportTitle() {
  const sel = document.getElementById('reportType');
  const title = sel.options[sel.selectedIndex].textContent;
  document.getElementById('currentReportTitle').textContent = title;
}

// --- HÀM ĐIỀU PHỐI CHÍNH ---
async function onViewReport() {
  renderReportTitle();
  const type = document.getElementById('reportType').value;
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  // Lấy giá trị năm cho báo cáo tháng
  const year = document.getElementById('yearReport').value; 

  try {
    if (type === 'gioitinh') await renderGenderReport();
    else if (type === 'dotuoi') await renderAgeReport();
    else if (type === 'biendong') await renderBiendongReport(start, end);
    else if (type === 'tamtru_tamvang') await renderTamTruTamVangReport(start, end);
    // [QUAN TRỌNG] Thêm dòng này để gọi báo cáo tháng
    else if (type === 'dansotheothang') await renderPopulationByMonth(year);

  } catch (err) {
    console.error('Report error', err);
    showTableMessage('Lỗi khi tải báo cáo: ' + (err.message || err));
  }
}

// ... (Giữ nguyên các hàm helper showTableMessage, escapeHtml, renderTableRows...) ...
function showTableMessage(msg, cols = 3) {
  const tbody = document.querySelector('#detailedReportTable tbody');
  tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center; color:#c00; padding:16px">${msg}</td></tr>`;
}

function escapeHtml(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }

function renderTableRows(rows) {
  const tbody = document.querySelector('#detailedReportTable tbody');
  if (!rows || rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 16px; color:#666">Chưa có dữ liệu</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="text-align:left; padding:10px">${escapeHtml(r.label)}</td>
      <td style="text-align:right; padding:10px">${r.count}</td>
      <td style="text-align:right; padding:10px">${(r.percent !== undefined ? r.percent.toFixed(2) : '')}</td>
    </tr>
  `).join('');
}

function renderTableRowsTwoCols(rows) {
  const tbody = document.querySelector('#detailedReportTable tbody');
  if (!rows || rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding: 16px; color:#666">Chưa có dữ liệu</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="text-align:left; padding:10px">${escapeHtml(r.label)}</td>
      <td style="text-align:right; padding:10px">${r.count}</td>
    </tr>
  `).join('');
}

function setTableThreeColumns() {
  const ths = document.querySelectorAll('#detailedReportTable thead th');
  if (ths && ths.length >= 3) ths[2].style.display = '';
  const cols = document.querySelectorAll('#detailedReportTable colgroup col');
  if (cols && cols.length >= 3) {
    cols[0].style.width = '60%';
    cols[1].style.width = '20%';
    cols[2].style.width = '20%';
    cols[2].style.display = '';
  }
}

function setTableTwoColumns() {
  const ths = document.querySelectorAll('#detailedReportTable thead th');
  if (ths && ths.length >= 3) ths[2].style.display = 'none';
  const cols = document.querySelectorAll('#detailedReportTable colgroup col');
  if (cols && cols.length >= 3) {
    cols[0].style.width = '70%';
    cols[1].style.width = '30%';
    cols[2].style.display = 'none';
  }
}

// Chart helpers
function clearChart() {
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }
}

function resetCanvas(canvasId = 'reportChart') {
  const old = document.getElementById(canvasId);
  if (!old) return;
  const parent = old.parentNode;
  const newCanvas = document.createElement('canvas');
  newCanvas.id = canvasId;
  parent.replaceChild(newCanvas, old);
}

function drawPieChart(labels, values, options = {}) {
  clearChart();
  resetCanvas('reportChart');
  const ctx = document.getElementById('reportChart').getContext('2d');
  const bg = generateColors(values.length);
  currentChart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data: values, backgroundColor: bg, borderColor: '#fff', borderWidth: 1 }] },
    options: Object.assign({ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#333', font: { size: 13, weight: 600 } } }, tooltip: { titleColor: '#fff', bodyColor: '#fff', callbacks: { label: function (ctx) { const v = ctx.raw || 0; return `${ctx.label}: ${v}`; } } } } }, options)
  });
}

function drawBarChart(labels, values, options = {}) {
  clearChart();
  resetCanvas('reportChart');
  const ctx = document.getElementById('reportChart').getContext('2d');
  const bg = generateColors(values.length);
  currentChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Số lượng (Đơn vị: người)', data: values, backgroundColor: bg, borderColor: '#fff', borderWidth: 1 }] },
    options: Object.assign({ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true }, x: { } }, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } } }, options)
  });

}

function generateColors(n) {
  const base = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ac'];
  const out = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}

// ... (Giữ nguyên renderGenderReport, renderAgeReport) ...
async function renderGenderReport() {
  setTableThreeColumns();
  const chartContainer = document.getElementById('reportChartContainer');
  if (chartContainer) chartContainer.style.display = 'block';
  showTableMessage('Đang tải dữ liệu...');
  const res = await fetch(`${API_ROOT}/residents`);
  if (!res.ok) throw new Error('Không thể tải danh sách nhân khẩu');
  const json = await res.json();
  const data = Array.isArray(json) ? json : (json.data || []);
  const filtered = data.filter(r => {
    const status = (r.TRANGTHAI || r.trangthai || '').toString();
    return status !== 'DaQuaDoi' && status !== 'ChuyenDi';
  });

  const counts = {};
  filtered.forEach(r => {
    const g = (r.GIOITINH || r.gioitinh || 'Khác').toString();
    counts[g] = (counts[g] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const values = labels.map(l => counts[l]);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const rows = labels.map((lab, i) => ({ label: lab, count: values[i], percent: values[i] * 100 / total }));

  drawPieChart(labels, values, { plugins: { legend: { position: 'bottom' } } });
  renderTableRows(rows);
}

async function renderAgeReport() {
  setTableThreeColumns();
  const chartContainer = document.getElementById('reportChartContainer');
  if (chartContainer) chartContainer.style.display = 'block';
  showTableMessage('Đang tải dữ liệu...');
  const res = await fetch(`${API_ROOT}/residents`);
  if (!res.ok) throw new Error('Không thể tải danh sách nhân khẩu');
  const json = await res.json();
  const data = Array.isArray(json) ? json : (json.data || []);
  const groupsDef = [
    { label: 'Mầm non (0-5)', min: 0, max: 5, count: 0 },
    { label: 'Cấp 1 (6-10)', min: 6, max: 10, count: 0 },
    { label: 'Cấp 2 (11-14)', min: 11, max: 14, count: 0 },
    { label: 'Cấp 3 (15-17)', min: 15, max: 17, count: 0 },
    { label: 'Độ tuổi lao động (18-62)', min: 18, max: 62, count: 0 },
    { label: 'Nghỉ hưu (63+)', min: 63, max: 200, count: 0 }
  ];

  const now = new Date();
  const filtered = data.filter(r => {
    const status = (r.TRANGTHAI || r.trangthai || '').toString();
    return status !== 'DaQuaDoi' && status !== 'ChuyenDi';
  });

  filtered.forEach(r => {
    const dob = r.NGAYSINH || r.ngaysinh;
    if (!dob) return;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return;
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    for (const g of groupsDef) {
      if (age >= g.min && age <= g.max) { g.count++; break; }
    }
  });

  const labels = groupsDef.map(g => g.label);
  const values = groupsDef.map(g => g.count);
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const rows = groupsDef.map(g => ({ label: g.label, count: g.count, percent: g.count * 100 / total }));

  drawBarChart(labels, values, { scales: { y: { beginAtZero: true } } });
  renderTableRows(rows);
}

async function renderBiendongReport(start, end) {
  setTableThreeColumns();
  const chartContainer = document.getElementById('reportChartContainer');
  if (chartContainer) chartContainer.style.display = 'block';
  showTableMessage('Đang tải dữ liệu biến động từ Server...');

  try {
    const sDate = start || '2025-01-01';
    const eDate = end || '2025-12-31';
    
    // Gọi API đã sửa
    const res = await fetch(`${API_ROOT}/reports/fluctuation?start=${sDate}&end=${eDate}`);
    if (!res.ok) throw new Error('Lỗi khi gọi API thống kê');
    
    const json = await res.json();
    const data = json.data || {};

    const categories = [
      { key: 'TaoMoi', label: 'Thường trú mới (Nhập khẩu)', color: '#28a745' },
      { key: 'TamTru', label: 'Đăng ký Tạm trú', color: '#17a2b8' },
      { key: 'TamVang', label: 'Khai báo Tạm vắng', color: '#ffc107' },
      { key: 'ChuyenDi', label: 'Đã chuyển đi', color: '#fd7e14' },
      { key: 'QuaDoi', label: 'Đã qua đời', color: '#dc3545' }
    ];

    const labels = categories.map(c => c.label);
    const values = categories.map(c => data[c.key] || 0);
    const bgColors = categories.map(c => c.color);

    clearChart();
    resetCanvas('reportChart');
    const ctx = document.getElementById('reportChart').getContext('2d');
    currentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Số lượng hồ sơ (Đơn vị: người)',
          data: values,
          backgroundColor: bgColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });

    const total = values.reduce((a, b) => a + b, 0) || 1;
    const rows = categories.map((c, i) => ({
      label: c.label,
      count: values[i],
      percent: (values[i] * 100 / total)
    }));
    renderTableRows(rows);

  } catch (err) {
    console.error(err);
    showTableMessage('Không thể tải dữ liệu thống kê: ' + err.message);
  }
}

// [MỚI] HÀM VẼ BIỂU ĐỒ DÂN SỐ THEO THÁNG (Đã bổ sung)
async function renderPopulationByMonth(year) {
    setTableTwoColumns(); 
    const chartContainer = document.getElementById('reportChartContainer');
    if (chartContainer) chartContainer.style.display = 'block';
    
    showTableMessage(`Đang tải dữ liệu dân số năm ${year}...`);

    const res = await fetch(`${API_ROOT}/reports/population-month?year=${year}`);
    if (!res.ok) throw new Error('Lỗi tải dữ liệu server');
    
    const json = await res.json();
    const data = json.data || []; 

    const labels = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    clearChart();
    resetCanvas('reportChart');
    const ctx = document.getElementById('reportChart').getContext('2d');
    
    currentChart = new Chart(ctx, {
        type: 'line', 
        data: {
            labels: labels,
            datasets: [{
                label: `Tổng dân số năm ${year}`,
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                tension: 0.3, 
                fill: true,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                y: {
                    beginAtZero: true, // Bắt buộc để không bị lỗi hiển thị nếu dữ liệu ít
                    ticks: { stepSize: 1 }
                }
            }
        }
    });

    const rows = labels.map((month, index) => ({
        label: month,
        count: data[index]
    }));
    renderTableRowsTwoCols(rows);
}

// ... (Các hàm helper khác _parseDate, computeRealTimeStatus, renderTamTruTamVangReport giữ nguyên) ...
function _parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function computeRealTimeStatus(record, type) {
  const now = new Date();
  const rs = record.NGAYBATDAU || record.NGAY_BAT_DAU || record.NGAY_BIEN_DONG || null;
  const re = record.NGAYKETTHUC || record.NGAY_KET_THUC || record.NGAYKETTHUC || null;
  const s = _parseDate(rs);
  const e = _parseDate(re);
  const raw = (record.TRANGTHAI || record.trangthai || '').toString();

  if (raw === 'DaTroVe') return 'Đã trở về';
  if (raw === 'ChuyenDi') return 'Đã chuyển đi';
  if (raw === 'DaQuaDoi') return 'Đã qua đời';

  if (type === 'tamtru') {
    if (s && now < s) return 'Chưa bắt đầu';
    if (s && e && now >= s && now <= e) return 'Đang tạm trú';
    if (e && now > e) return 'Đã hết hạn';
    if (raw === 'DangHieuLuc') return 'Đang tạm trú';
  }

  if (type === 'tamvang') {
    if (s && now < s) return 'Chưa bắt đầu';
    if (s && e && now >= s && now <= e) return 'Đang tạm vắng';
    if (e && now > e) return 'Đã trở về';
    if (raw === 'DangTamVang') return 'Đang tạm vắng';
  }
  return raw || '';
}

function formatDate(val) {
  const d = _parseDate(val);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatDateTime(val) {
  const d = _parseDate(val || new Date());
  if (!d) return '';
  const datePart = formatDate(d);
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${datePart} ${hh}:${mi}:${ss}`;
} 

function csvCell(v, forceText = false) {
  if (v === undefined || v === null || v === '') return '""';
  const s = String(v).replace(/"/g, '""');
  if (forceText) return `="${s}"`;
  return `"${s}"`;
}  

async function renderTamTruTamVangReport(start, end) {
  showTableMessage('Đang tải dữ liệu...', 2);
  setTableTwoColumns();
  const chartContainer = document.getElementById('reportChartContainer');
  if (chartContainer) { chartContainer.style.display = 'none'; }
  clearChart();

  const [ttRes, tvRes, resRes] = await Promise.all([
    fetch(`${API_ROOT}/residencechanges/tamtru`),
    fetch(`${API_ROOT}/residencechanges/tamvang`),
    fetch(`${API_ROOT}/residents`)
  ]);

  if (!ttRes.ok || !tvRes.ok || !resRes.ok) throw new Error('Không thể tải dữ liệu');

  const [ttJson, tvJson, resJson] = await Promise.all([ttRes.json(), tvRes.json(), resRes.json()]);
  const ttData = ttJson.data || [];
  const tvData = tvJson.data || [];
  const residents = Array.isArray(resJson) ? resJson : (resJson.data || []);
  const qStart = _parseDate(start) || new Date('1970-01-01');
  const qEnd = _parseDate(end) || new Date('9999-12-31');

  const statusById = new Map();
  residents.forEach(r => statusById.set(String(r.MANHANKHAU), (r.TRANGTHAI || r.trangthai || '').toString()));

  const tamTruSet = new Set();
  ttData.forEach(r => {
    const rs = r.NGAYBATDAU || r.NGAY_BAT_DAU || r.NGAY_BIEN_DONG || null;
    const re = r.NGAYKETTHUC || r.NGAY_KET_THUC || null;
    const startDate = _parseDate(rs);
    const endDate = _parseDate(re) || new Date('9999-12-31');
    if (startDate && !(startDate > qEnd || endDate < qStart)) {
      tamTruSet.add(String(r.MANHANKHAU));
    }
  });

  const tamVangSet = new Set();
  tvData.forEach(r => {
    const rs = r.NGAYBATDAU || r.NGAY_BAT_DAU || r.NGAY_BIEN_DONG || null;
    const re = r.NGAYKETTHUC || r.NGAY_KET_THUC || null;
    const startDate = _parseDate(rs);
    const endDate = _parseDate(re) || new Date('9999-12-31');
    if (startDate && !(startDate > qEnd || endDate < qStart)) {
      tamVangSet.add(String(r.MANHANKHAU));
    }
  });

  let tamTruCount = 0;
  tamTruSet.forEach(id => {
    const st = statusById.get(id) || '';
    if (st !== 'DaQuaDoi' && st !== 'ChuyenDi') tamTruCount++;
  });
  let tamVangCount = 0;
  tamVangSet.forEach(id => {
    const st = statusById.get(id) || '';
    if (st !== 'DaQuaDoi' && st !== 'ChuyenDi') tamVangCount++;
  });

  const labels = ['Số người đang tạm trú', 'Số nhân khẩu đang tạm vắng'];
  const values = [tamTruCount, tamVangCount];
  const rows = labels.map((lab, i) => ({ label: lab, count: values[i] }));
  renderTableRowsTwoCols(rows);
}

// ==========================================
// 1. HÀM XUẤT EXCEL (Đã cập nhật logic thời gian)
// ==========================================
async function onExportExcel() {
  const type = document.getElementById('reportType').value;
  const title = document.getElementById('currentReportTitle').textContent;
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  const year = document.getElementById('yearReport').value;

  // --- SỬA LOGIC HIỂN THỊ THỜI GIAN ---
  let timeString = '';
  const nowStr = formatDateTime(new Date()); // Lấy thời gian thực (Ngày + Giờ)

  if (type === 'gioitinh' || type === 'dotuoi') {
      // Yêu cầu: Giới tính & Độ tuổi -> "Tính đến ngày + Giờ hiện tại"
      timeString = `Tính đến ngày: ${nowStr}`;
  } else if (type === 'dansotheothang') {
      timeString = `Năm báo cáo: ${year}`;
  } else if (start && end) {
      // Các báo cáo khác (Biến động, Tạm trú...) -> Hiển thị khoảng thời gian
      timeString = `Khoảng thời gian: ${formatDate(start)} - ${formatDate(end)}`;
  } else {
      timeString = `Ngày xuất báo cáo: ${formatDate(new Date())}`;
  }

  // Kiểm tra thư viện
  if (typeof XLSX === 'undefined') {
    alert('Đang tải thư viện Excel, vui lòng thử lại sau vài giây...');
    return;
  }

  // ... (Phần xử lý Tạm trú/Tạm vắng GIỮ NGUYÊN) ...
  if (type === 'tamtru_tamvang') {
    // Copy lại y nguyên nội dung cũ của phần này
    const btn = document.getElementById('btnExportExcel');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    try {
      const [ttRes, tvRes, resRes] = await Promise.all([
        fetch(`${API_ROOT}/residencechanges/tamtru`),
        fetch(`${API_ROOT}/residencechanges/tamvang`),
        fetch(`${API_ROOT}/residents`)
      ]);
      if (!ttRes.ok || !tvRes.ok || !resRes.ok) throw new Error('Lỗi tải dữ liệu');
      const [ttJson, tvJson, resJson] = await Promise.all([ttRes.json(), tvRes.json(), resRes.json()]);
      const ttData = ttJson.data || [];
      const tvData = tvJson.data || [];
      const residents = Array.isArray(resJson) ? resJson : (resJson.data || []);
      const qStart = _parseDate(start) || new Date('1970-01-01');
      const qEnd = _parseDate(end) || new Date('9999-12-31');
      function overlaps(r) {
        const rs = r.NGAYBATDAU || r.NGAY_BAT_DAU || r.NGAY_BIEN_DONG || null;
        const re = r.NGAYKETTHUC || r.NGAY_KET_THUC || null;
        const s = _parseDate(rs);
        const e = _parseDate(re) || new Date('9999-12-31');
        return s && !(s > qEnd || e < qStart);
      }
      const statusById = new Map();
      residents.forEach(r => statusById.set(String(r.MANHANKHAU), (r.TRANGTHAI || r.trangthai || '').toString()));
      const filterFn = r => overlaps(r) && !['DaQuaDoi', 'ChuyenDi'].includes(statusById.get(String(r.MANHANKHAU)));
      function uniqueById(arr) {
        const m = new Map();
        arr.forEach(r => { const id = String(r.MANHANKHAU || ''); if (id && !m.has(id)) m.set(id, r); });
        return Array.from(m.values());
      }
      const ttList = uniqueById(ttData.filter(filterFn));
      const tvList = uniqueById(tvData.filter(filterFn));
      const mapToExcelRow = (item, type) => ({
        "Họ và tên": item.HOTEN,
        "Mã NK": item.MANHANKHAU,
        "CCCD": item.CCCD || "Chưa có",
        "Địa chỉ / Nơi đến": item.DIACHITAMTRU || item.NOITAMTRU,
        "Từ ngày": formatDate(item.NGAYBATDAU || item.NGAY_BIEN_DONG),
        "Đến ngày": formatDate(item.NGAYKETTHUC),
        "Lý do": item.LYDO || item.GHICHU,
        "Trạng thái": computeRealTimeStatus(item, type)
      });
      const sheet1Data = ttList.map(item => mapToExcelRow(item, 'tamtru'));
      const sheet2Data = tvList.map(item => mapToExcelRow(item, 'tamvang'));
      const wb = XLSX.utils.book_new();
      const headerRows1 = [[title.toUpperCase()], [timeString], ['(Đơn vị: người)'], [`Tổng số: ${ttList.length}`], []];
      const ws1 = XLSX.utils.aoa_to_sheet(headerRows1);
      XLSX.utils.sheet_add_json(ws1, sheet1Data, { origin: "A6" });
      XLSX.utils.book_append_sheet(wb, ws1, "DS Tạm trú");
      const headerRows2 = [[title.toUpperCase() + " (TẠM VẮNG)"], [timeString], ['(Đơn vị: người)'], [`Tổng số: ${tvList.length}`], []];
      const ws2 = XLSX.utils.aoa_to_sheet(headerRows2);
      XLSX.utils.sheet_add_json(ws2, sheet2Data, { origin: "A6" });
      XLSX.utils.book_append_sheet(wb, ws2, "DS Tạm vắng");
      XLSX.writeFile(wb, `BaoCao_TamTru_TamVang_${formatDate(new Date()).replace(/\//g,'-')}.xlsx`);
    } catch (err) {
      alert('Lỗi xuất Excel: ' + err.message);
    } finally {
      btn.innerHTML = originalText;
    }
    return;
  }

  // --- TRƯỜNG HỢP 2: CÁC BÁO CÁO KHÁC (GIỚI TÍNH, ĐỘ TUỔI...) ---
  const table = document.getElementById('detailedReportTable');
  if (!table || table.rows.length <= 1) {
    alert('Không có dữ liệu để xuất!');
    return;
  }
  const wb = XLSX.utils.book_new();
  const headerRows = [[title.toUpperCase()], [timeString], ['(Đơn vị: người)'], []];
  const ws = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.sheet_add_dom(ws, table, { origin: "A5" });

  let fileName = 'BaoCao_ThongKe.xlsx';
  if (type === 'dansotheothang') fileName = `DanSo_TheoThang_Nam${year}.xlsx`;
  else fileName = `BaoCao_${type}.xlsx`;

  XLSX.utils.book_append_sheet(wb, ws, "Số liệu");
  XLSX.writeFile(wb, fileName);
}


// ==========================================
// 2. HÀM XUẤT PDF (Đã cập nhật logic thời gian)
// ==========================================
async function onExportPdf() {
  const type = document.getElementById('reportType').value;
  const title = document.getElementById('currentReportTitle').textContent;
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  const year = document.getElementById('yearReport').value;

  // --- SỬA LOGIC HIỂN THỊ THỜI GIAN CHO PDF ---
  const nowStr = formatDateTime(new Date());
  let timeRangeStr = '';

  if (type === 'gioitinh' || type === 'dotuoi') {
      // Yêu cầu: Giới tính & Độ tuổi -> "Tính đến ngày + Giờ hiện tại"
      timeRangeStr = `Tính đến ngày: ${nowStr}`;
  } else if (type === 'dansotheothang') {
      timeRangeStr = `Năm báo cáo: ${year}`;
  } else if (start && end) {
      timeRangeStr = `Thời gian: ${formatDate(start)} - ${formatDate(end)}`;
  } else {
      timeRangeStr = `Tính đến ngày: ${nowStr}`;
  }

  // ... (Phần xử lý Tạm trú/Tạm vắng GIỮ NGUYÊN) ...
  if (type === 'tamtru_tamvang') {
    const btn = document.getElementById('btnExportPdf');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo PDF...';
    try {
      const [ttRes, tvRes, resRes] = await Promise.all([
        fetch(`${API_ROOT}/residencechanges/tamtru`),
        fetch(`${API_ROOT}/residencechanges/tamvang`),
        fetch(`${API_ROOT}/residents`)
      ]);
      if (!ttRes.ok || !tvRes.ok || !resRes.ok) throw new Error('Không thể tải dữ liệu chi tiết');
      const [ttJson, tvJson, resJson] = await Promise.all([ttRes.json(), tvRes.json(), resRes.json()]);
      const ttData = ttJson.data || [];
      const tvData = tvJson.data || [];
      const residents = Array.isArray(resJson) ? resJson : (resJson.data || []);
      const qStart = _parseDate(start) || new Date('1970-01-01');
      const qEnd = _parseDate(end) || new Date('9999-12-31');
      function overlaps(r) {
        const rs = r.NGAYBATDAU || r.NGAY_BAT_DAU || r.NGAY_BIEN_DONG || null;
        const re = r.NGAYKETTHUC || r.NGAY_KET_THUC || null;
        const s = _parseDate(rs);
        const e = _parseDate(re) || new Date('9999-12-31');
        return s && !(s > qEnd || e < qStart);
      }
      const statusById = new Map();
      residents.forEach(r => statusById.set(String(r.MANHANKHAU), (r.TRANGTHAI || r.trangthai || '').toString()));
      const ttFiltered = ttData.filter(r => overlaps(r) && !['DaQuaDoi', 'ChuyenDi'].includes(statusById.get(String(r.MANHANKHAU))));
      const tvFiltered = tvData.filter(r => overlaps(r) && !['DaQuaDoi', 'ChuyenDi'].includes(statusById.get(String(r.MANHANKHAU))));
      function uniqueById(arr) {
        const m = new Map();
        arr.forEach(r => { const id = String(r.MANHANKHAU || ''); if (id && !m.has(id)) m.set(id, r); });
        return Array.from(m.values());
      }
      const ttList = uniqueById(ttFiltered);
      const tvList = uniqueById(tvFiltered);
      const headerHtml = `
        <div class="header">
            <h1>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
            <p>Độc lập - Tự do - Hạnh phúc</p>
            <hr style="width:150px; margin: 10px auto;">
            <h2 style="margin-top:20px">${escapeHtml(title).toUpperCase()}</h2>
            <p><em>${timeRangeStr}</em></p>
            <p><em>(Đơn vị: người)</em></p>
            <p style="text-align:left; margin-top:20px">
                <strong>Tổng số Tạm trú:</strong> ${ttList.length} người &nbsp;&nbsp;|&nbsp;&nbsp; 
                <strong>Tổng số Tạm vắng:</strong> ${tvList.length} người
            </p>
        </div>
      `;
      function buildTableHtml(list, title, type) {
        if (!list || list.length === 0) return '';
        const rows = list.map((e, idx) => `
          <tr>
            <td style="text-align:center">${idx + 1}</td>
            <td>${escapeHtml(e.HOTEN)}<br><small>Mã: ${e.MANHANKHAU}</small></td>
            <td>${escapeHtml(e.CCCD || 'Chưa có')}</td> 
            <td>${escapeHtml(e.DIACHITAMTRU || e.NOITAMTRU || '')}</td>
            <td>${formatDate(e.NGAYBATDAU || e.NGAY_BIEN_DONG)} - ${formatDate(e.NGAYKETTHUC)}</td>
            <td>${escapeHtml(e.LYDO || e.GHICHU || '')}</td>
          </tr>
        `).join('');
        return `
          <h3 style="margin-top:20px; border-bottom: 2px solid #333; padding-bottom: 5px;">${title}</h3>
          <table>
            <thead>
              <tr><th width="5%">STT</th><th width="20%">Họ tên</th><th width="15%">CCCD</th><th>Địa chỉ / Nơi đến</th><th width="18%">Thời gian</th><th width="15%">Lý do</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      }
      openPrintWindow(
        headerHtml + 
        buildTableHtml(ttList, 'DANH SÁCH ĐĂNG KÝ TẠM TRÚ', 'tamtru') + 
        buildTableHtml(tvList, 'DANH SÁCH KHAI BÁO TẠM VẮNG', 'tamvang')
      );
    } catch (err) {
      alert('Lỗi xuất PDF: ' + err.message);
    } finally {
      btn.innerHTML = originalText;
    }
    return;
  }

  // --- TRƯỜNG HỢP 2: CÁC BÁO CÁO BIỂU ĐỒ KHÁC ---
  const canvas = document.getElementById('reportChart');
  let chartImg = '';
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    chartImg = canvas.toDataURL('image/png');
  }

  const tableHtml = document.querySelector('.report-table-data').outerHTML;

  const contentHtml = `
    <div class="header">
        <h1>BÁO CÁO THỐNG KÊ DÂN CƯ</h1>
        <h2>${escapeHtml(title).toUpperCase()}</h2>
        <p>${timeRangeStr}</p>
        <p><em>(Đơn vị: người)</em></p>
    </div>
    
    <div style="text-align:center; margin: 30px 0;">
        ${chartImg ? `<img src="${chartImg}" style="max-width:100%; height:auto; border:1px solid #ddd;" />` : ''}
    </div>

    <div style="margin-top: 20px;">
        <h3>Số liệu chi tiết</h3>
        ${tableHtml}
    </div>
    
    <div class="footer" style="margin-top: 50px; text-align: right;">
        <p><em>Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth()+1} năm ${new Date().getFullYear()}</em></p>
        <p><strong>Người lập báo cáo</strong></p>
        <br><br><br>
        <p>(Ký và ghi rõ họ tên)</p>
    </div>
  `;

  openPrintWindow(contentHtml);
}

function openPrintWindow(content) {
  const w = window.open('', '_blank', 'width=900,height=800');
  w.document.write(`
    <html>
      <head>
        <title>In Báo Cáo</title>
        <style>
          body { font-family: "Times New Roman", serif; padding: 40px; color: #000; background: #fff; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { font-size: 16pt; margin: 0; font-weight: bold; }
          h2 { font-size: 18pt; margin: 10px 0; font-weight: bold; }
          p { margin: 5px 0; font-size: 13pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12pt; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
          /* Ẩn các phần tử thừa khi in */
          @media print {
            @page { margin: 2cm; size: A4; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          // Tự động in khi tải xong hình ảnh
          window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); }
        </script>
      </body>
    </html>
  `);
  w.document.close();
}