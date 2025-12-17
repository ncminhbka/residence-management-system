// frontend/assets/js/reports.js

const API_ROOT = '/api/v1';
let currentChart = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnViewReport').addEventListener('click', onViewReport);
  document.getElementById('btnExportExcel').addEventListener('click', onExportExcel);
  document.getElementById('btnExportPdf').addEventListener('click', onExportPdf);
  document.getElementById('reportType').addEventListener('change', () => {
    renderReportTitle();
    const gv = document.getElementById('groupByContainer');
    if (document.getElementById('reportType').value === 'biendong') gv.style.display = 'block';
    else gv.style.display = 'none';
  });
  // period selection controls for biendong
  const periodTypeEl = document.getElementById('periodType');
  const periodYearEl = document.getElementById('periodYear');
  const periodMonthEl = document.getElementById('periodMonth');
  const periodQuarterEl = document.getElementById('periodQuarter');
  function updatePeriodInputs() {
    const v = periodTypeEl.value;
    periodYearEl.style.display = (v === 'year' || v === 'quarter') ? '' : 'none';
    periodMonthEl.style.display = (v === 'month') ? '' : 'none';
    periodQuarterEl.style.display = (v === 'quarter') ? '' : 'none';
    // if year selected, prefill with current year
    if (v === 'year' && !periodYearEl.value) periodYearEl.value = new Date().getFullYear();
    // if month selected, prefill with current month
    if (v === 'month' && !periodMonthEl.value) {
      const d = new Date(); periodMonthEl.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }
  }
  periodTypeEl && periodTypeEl.addEventListener('change', updatePeriodInputs);
  periodYearEl && periodYearEl.addEventListener('change', () => { syncDatesFromPeriod(); });
  periodMonthEl && periodMonthEl.addEventListener('change', () => { syncDatesFromPeriod(); });
  periodQuarterEl && periodQuarterEl.addEventListener('change', () => { syncDatesFromPeriod(); });
  function syncDatesFromPeriod() {
    const type = periodTypeEl.value;
    const sd = document.getElementById('startDate');
    const ed = document.getElementById('endDate');
    if (type === 'year') {
      const y = Number(periodYearEl.value) || new Date().getFullYear();
      sd.value = `${y}-01-01`;
      ed.value = `${y}-12-31`;
    } else if (type === 'month') {
      if (!periodMonthEl.value) return;
      const [y,m] = periodMonthEl.value.split('-').map(Number);
      sd.value = `${y}-${String(m).padStart(2,'0')}-01`;
      const last = new Date(y, m, 0).getDate();
      ed.value = `${y}-${String(m).padStart(2,'0')}-${String(last).padStart(2,'0')}`;
    } else if (type === 'quarter') {
      const y = Number(periodYearEl.value) || new Date().getFullYear();
      const q = Number(periodQuarterEl.value) || 1;
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      const last = new Date(y, endMonth, 0).getDate();
      sd.value = `${y}-${String(startMonth).padStart(2,'0')}-01`;
      ed.value = `${y}-${String(endMonth).padStart(2,'0')}-${String(last).padStart(2,'0')}`;
    }
  }
  // initialize
  updatePeriodInputs();
  renderReportTitle();
  onViewReport();
});

function renderReportTitle() {
  const sel = document.getElementById('reportType');
  const title = sel.options[sel.selectedIndex].textContent;
  document.getElementById('currentReportTitle').textContent = title;

}

async function onViewReport() {
  renderReportTitle();
  const type = document.getElementById('reportType').value;
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;

  try {
    if (type === 'gioitinh') await renderGenderReport();

    else if (type === 'dotuoi') await renderAgeReport();
    else if (type === 'biendong') await renderBiendongReport(start, end);
    else if (type === 'tamtru_tamvang') await renderTamTruTamVangReport(start, end);
  } catch (err) {
    console.error('Report error', err);
    showTableMessage('Lỗi khi tải báo cáo: ' + (err.message || err));
  }
}

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
    options: Object.assign({ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#ffffff', font: { size: 13, weight: 600 } } }, tooltip: { titleColor: '#ffffff', bodyColor: '#ffffff', callbacks: { label: function (ctx) { const v = ctx.raw || 0; return `${ctx.label}: ${v}`; } } } } }, options)
  });
}

function drawBarChart(labels, values, options = {}) {
  clearChart();
  resetCanvas('reportChart');
  const ctx = document.getElementById('reportChart').getContext('2d');
  const bg = generateColors(values.length);
  currentChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Số lượng', data: values, backgroundColor: bg, borderColor: '#fff', borderWidth: 1 }] },
    options: Object.assign({ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } } }, plugins: { legend: { display: false, labels: { color: '#ffffff' } }, tooltip: { titleColor: '#ffffff', bodyColor: '#ffffff', mode: 'index', intersect: false } } }, options)
  });
}

function generateColors(n) {
  const base = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ac'];
  const out = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return out;
}

// Report implementations
async function renderGenderReport() {
  // ensure table is in 3-column mode and chart visible for this report
  setTableThreeColumns();
  const chartContainer = document.getElementById('reportChartContainer');
  if (chartContainer) chartContainer.style.display = 'block';
  showTableMessage('Đang tải dữ liệu...');
  const res = await fetch(`${API_ROOT}/residents`);
  if (!res.ok) throw new Error('Không thể tải danh sách nhân khẩu (yêu cầu đăng nhập?)');
  const json = await res.json();
  const data = Array.isArray(json) ? json : (json.data || []);
  // Loại trừ những nhân khẩu đã qua đời hoặc đã chuyển đi
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

  // Draw as pie for visual
  drawPieChart(labels, values, { plugins: { legend: { position: 'bottom' } } });
  renderTableRows(rows);
}

async function renderAgeReport() {
  // ensure table is in 3-column mode and chart visible for this report
  setTableThreeColumns();
  const chartContainer = document.getElementById('reportChartContainer');
  if (chartContainer) chartContainer.style.display = 'block';
  showTableMessage('Đang tải dữ liệu...');
  const res = await fetch(`${API_ROOT}/residents`);
  if (!res.ok) throw new Error('Không thể tải danh sách nhân khẩu (yêu cầu đăng nhập?)');
  const json = await res.json();
  const data = Array.isArray(json) ? json : (json.data || []);
  // Use fixed age groups as requested and exclude deceased / moved-out
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

  // Show groups description below the chart
  const infoEl = document.getElementById('ageGroupsInfo');
  if (infoEl) {
    infoEl.textContent = labels.join(' • ');
  }
}

async function renderBiendongReport(start, end) {
  // ensure table is in 3-column mode and chart visible for this report
  setTableThreeColumns();
  const chartContainer = document.getElementById('reportChartContainer');
  if (chartContainer) chartContainer.style.display = 'block';
  showTableMessage('Đang tải dữ liệu...');
  const [tvRes, ttRes] = await Promise.all([
    fetch(`${API_ROOT}/residencechanges/tamvang`),
    fetch(`${API_ROOT}/residencechanges/tamtru`)
  ]);

  const tvJson = tvRes.ok ? await tvRes.json().catch(() => ({ data: [] })) : { data: [] };
  const ttJson = ttRes.ok ? await ttRes.json().catch(() => ({ data: [] })) : { data: [] };
  const tvData = tvJson.data || [];
  const ttData = ttJson.data || [];

  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  function inRange(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (s && d < s) return false;
    if (e && d > e) return false;
    return true;
  }

  const addedTamVang = tvData.filter(r => inRange(r.NGAYBATDAU || r.NGAY_BAT_DAU || r.NGAY_BIEN_DONG || r.NGAY_BIEN_DONG)).length;
  const addedTamTru = ttData.filter(r => inRange(r.NGAYBATDAU || r.NGAYBATDAU || r.NGAY_BAT_DAU || r.NGAY_BIEN_DONG)).length;

  const labels = ['Đăng ký Tạm trú', 'Khai báo Tạm vắng'];
  const values = [addedTamTru, addedTamVang];
  const rows = labels.map((lab, i) => ({ label: lab, count: values[i], percent: values[i] * 100 / ((values[0] + values[1]) || 1) }));

  drawBarChart(labels, values, { plugins: { legend: { display: false } } });
  renderTableRows(rows);
}

function _parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// Compute a human-friendly real-time status for a tamtru/tamvang record
function computeRealTimeStatus(record, type) {
  const now = new Date();
  const rs = record.NGAYBATDAU || record.NGAY_BAT_DAU || record.NGAY_BIEN_DONG || null;
  const re = record.NGAYKETTHUC || record.NGAY_KET_THUC || record.NGAYKETTHUC || null;
  const s = _parseDate(rs);
  const e = _parseDate(re);
  const raw = (record.TRANGTHAI || record.trangthai || '').toString();

  // explicit state overrides
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

// Format a date string or Date into dd/mm/yyyy (Vietnamese common format)
function formatDate(val) {
  const d = _parseDate(val);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Format date+time as dd/mm/yyyy HH:MM:SS for export timestamps
function formatDateTime(val) {
  const d = _parseDate(val || new Date());
  if (!d) return '';
  const datePart = formatDate(d);
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${datePart} ${hh}:${mi}:${ss}`;
} 

// Helper to create CSV cell values; forceText -> use Excel formula syntax to preserve as string (="...")
function csvCell(v, forceText = false) {
  if (v === undefined || v === null || v === '') return '""';
  const s = String(v).replace(/"/g, '""');
  if (forceText) return `="${s}"`;
  return `"${s}"`;
}  

async function renderTamTruTamVangReport(start, end) {
  showTableMessage('Đang tải dữ liệu...', 2);
  // set table to 2-column mode and hide chart for this report (we only show numeric summary)
  setTableTwoColumns();
  const chartContainer = document.getElementById('reportChartContainer');
  if (chartContainer) { chartContainer.style.display = 'none'; }
  clearChart();
  // Fetch lists so we can exclude residents who are deceased or moved out
  const [ttRes, tvRes, resRes] = await Promise.all([
    fetch(`${API_ROOT}/residencechanges/tamtru`),
    fetch(`${API_ROOT}/residencechanges/tamvang`),
    fetch(`${API_ROOT}/residents`)
  ]);

  if (!ttRes.ok || !tvRes.ok || !resRes.ok) throw new Error('Không thể tải dữ liệu tạm trú/tạm vắng/nhân khẩu');

  const [ttJson, tvJson, resJson] = await Promise.all([ttRes.json(), tvRes.json(), resRes.json()]);
  const ttData = ttJson.data || [];
  const tvData = tvJson.data || [];
  const residents = Array.isArray(resJson) ? resJson : (resJson.data || []);
  // Parse query range
  const qStart = _parseDate(start) || new Date('1970-01-01');
  const qEnd = _parseDate(end) || new Date('9999-12-31');

  // Map resident status by MANHANKHAU for quick lookup
  const statusById = new Map();
  residents.forEach(r => statusById.set(String(r.MANHANKHAU), (r.TRANGTHAI || r.trangthai || '').toString()));

  // Count unique residents with records overlapping the query range
  const tamTruSet = new Set();
  ttData.forEach(r => {
    // find record start/end in various field names
    const rs = r.NGAYBATDAU || r.NGAY_BAT_DAU || r.NGAY_BIEN_DONG || r.NGAY_BIEN_DONG || r.NGAYBATDAU || null;
    const re = r.NGAYKETTHUC || r.NGAY_KET_THUC || r.NGAYKETTHUC || null;
    const startDate = _parseDate(rs);
    const endDate = _parseDate(re) || new Date('9999-12-31');
    // overlap condition
    if (startDate && !(startDate > qEnd || endDate < qStart)) {
      tamTruSet.add(String(r.MANHANKHAU));
    }
  });

  const tamVangSet = new Set();
  tvData.forEach(r => {
    const rs = r.NGAYBATDAU || r.NGAY_BAT_DAU || r.NGAY_BIEN_DONG || r.NGAY_BIEN_DONG || r.NGAYBATDAU || null;
    const re = r.NGAYKETTHUC || r.NGAY_KET_THUC || r.NGAYKETTHUC || null;
    const startDate = _parseDate(rs);
    const endDate = _parseDate(re) || new Date('9999-12-31');
    if (startDate && !(startDate > qEnd || endDate < qStart)) {
      tamVangSet.add(String(r.MANHANKHAU));
    }
  });

  // Exclude residents who are DaQuaDoi or ChuyenDi
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

async function onExportExcel() {
  const type = document.getElementById('reportType').value;
  // special handling for Tạm trú / Tạm vắng: export detailed records with time info
  if (type === 'tamtru_tamvang') {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    const [ttRes, tvRes] = await Promise.all([
      fetch(`${API_ROOT}/residencechanges/tamtru`),
      fetch(`${API_ROOT}/residencechanges/tamvang`)
    ]);
    if (!ttRes.ok || !tvRes.ok) { alert('Không thể tải dữ liệu để xuất'); return; }
    const [ttJson, tvJson] = await Promise.all([ttRes.json(), tvRes.json()]);
    const ttData = ttJson.data || [];
    const tvData = tvJson.data || [];

    const qStart = _parseDate(start) || new Date('1970-01-01');
    const qEnd = _parseDate(end) || new Date('9999-12-31');
    function overlaps(r) {
      const rs = r.NGAYBATDAU || r.NGAY_BAT_DAU || r.NGAY_BIEN_DONG || null;
      const re = r.NGAYKETTHUC || r.NGAY_KET_THUC || null;
      const s = _parseDate(rs);
      const e = _parseDate(re) || new Date('9999-12-31');
      return s && !(s > qEnd || e < qStart);
    }

    // get residents to check status and for consistent names
    const resRes = await fetch(`${API_ROOT}/residents`);
    const residents = resRes.ok ? (await resRes.json()).data || [] : [];
    const statusById = new Map();
    residents.forEach(r => statusById.set(String(r.MANHANKHAU), (r.TRANGTHAI || r.trangthai || '').toString()));

    const ttFiltered = ttData.filter(r => overlaps(r) && (statusById.get(String(r.MANHANKHAU)) || '') !== 'DaQuaDoi' && (statusById.get(String(r.MANHANKHAU)) || '') !== 'ChuyenDi');
    const tvFiltered = tvData.filter(r => overlaps(r) && (statusById.get(String(r.MANHANKHAU)) || '') !== 'DaQuaDoi' && (statusById.get(String(r.MANHANKHAU)) || '') !== 'ChuyenDi');

    // produce unique lists by MANHANKHAU (one row per person)
    function uniqueById(arr) {
      const m = new Map();
      arr.forEach(r => { const id = String(r.MANHANKHAU || ''); if (!id) return; if (!m.has(id)) m.set(id, r); });
      return Array.from(m.values());
    }
    const ttList = uniqueById(ttFiltered);
    const tvList = uniqueById(tvFiltered);

    const csv = [];
    csv.push([`Báo cáo: Tạm trú / Tạm vắng`].join(','));
    csv.push([`Khoảng thời gian: ${start || ''} ${start && end ? '—' : ''} ${end || ''}`].join(','));
    csv.push([]);
    csv.push([`Tổng số người đang tạm trú: ${ttList.length}`].join(','));
    csv.push([`Tổng số nhân khẩu đang tạm vắng: ${tvList.length}`].join(','));
    csv.push([]);

    // Tạm trú section
    csv.push(["Danh sách Tạm trú"]) ;
    csv.push(['Họ tên','Mã nhân khẩu','Số CCCD','Nơi','Ngày bắt đầu','Ngày kết thúc','Ghi chú','Trạng thái'].join(','));
    ttList.forEach(e => {
      const row = [
        csvCell(e.HOTEN),
        csvCell(e.MANHANKHAU, true),
        csvCell(e.CCCD, true),
        csvCell(e.DIACHITAMTRU || e.NOITAMTRU || ''),
        csvCell(formatDate(e.NGAYBATDAU || e.NGAY_BAT_DAU || e.NGAY_BIEN_DONG || '')),
        csvCell(formatDate(e.NGAYKETTHUC || e.NGAY_KET_THUC || '')),
        csvCell(e.GHICHU || e.LYDO || ''),
        csvCell(computeRealTimeStatus(e, 'tamtru'))
      ];
      csv.push(row.join(','));
    });

    csv.push([]);
    // Tạm vắng section
    csv.push(["Danh sách Tạm vắng"]);
    csv.push(['Họ tên','Mã nhân khẩu','Số CCCD','Nơi','Ngày bắt đầu','Ngày kết thúc','Ghi chú','Trạng thái'].join(','));
    tvList.forEach(e => {
      const row = [
        csvCell(e.HOTEN),
        csvCell(e.MANHANKHAU, true),
        csvCell(e.CCCD, true),
        csvCell(e.NOITAMTRU || e.DIACHITAMTRU || ''),
        csvCell(formatDate(e.NGAYBATDAU || e.NGAY_BAT_DAU || e.NGAY_BIEN_DONG || '')),
        csvCell(formatDate(e.NGAYKETTHUC || e.NGAY_KET_THUC || '')),
        csvCell(e.LYDO || e.GHICHU || ''),
        csvCell(computeRealTimeStatus(e, 'tamvang'))
      ];
      csv.push(row.join(','));
    });

    // Prepend UTF-8 BOM so Excel recognizes Unicode (fix Vietnamese accent issues)
    const csvContent = '\uFEFF' + csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tamtru_tamvang_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // default behavior (summary tables) - still add BOM so Excel shows Vietnamese correctly
  const rows = Array.from(document.querySelectorAll('#detailedReportTable tbody tr'));
  if (rows.length === 0) { alert('Không có dữ liệu để xuất'); return; }
  const title = document.getElementById('currentReportTitle').textContent;
  const nowStr = formatDateTime(new Date());
  const csv = [];
  csv.push([`Báo cáo: ${title}`].join(','));
  csv.push([`Tính đến: ${nowStr}`].join(','));
  csv.push([]);
  csv.push(['Chỉ mục', 'Số lượng', 'Tỷ lệ (%)'].join(','));
  rows.forEach(r => {
    const cols = Array.from(r.querySelectorAll('td')).map(td => '"' + td.innerText.replace(/"/g, '""') + '"');
    csv.push(cols.join(','));
  });
  const csvContent = '\uFEFF' + csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${document.getElementById('reportType').value}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function onExportPdf() {
  const type = document.getElementById('reportType').value;
  const title = document.getElementById('currentReportTitle').textContent;

  // For tamtru_tamvang build a detailed table including dates
  if (type === 'tamtru_tamvang') {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    const [ttRes, tvRes] = await Promise.all([
      fetch(`${API_ROOT}/residencechanges/tamtru`),
      fetch(`${API_ROOT}/residencechanges/tamvang`)
    ]);
    if (!ttRes.ok || !tvRes.ok) { alert('Không thể tải dữ liệu để xuất'); return; }
    const [ttJson, tvJson] = await Promise.all([ttRes.json(), tvRes.json()]);
    const ttData = ttJson.data || [];
    const tvData = tvJson.data || [];

    const qStart = _parseDate(start) || new Date('1970-01-01');
    const qEnd = _parseDate(end) || new Date('9999-12-31');
    function overlaps(r) {
      const rs = r.NGAYBATDAU || r.NGAY_BAT_DAU || r.NGAY_BIEN_DONG || null;
      const re = r.NGAYKETTHUC || r.NGAY_KET_THUC || null;
      const s = _parseDate(rs);
      const e = _parseDate(re) || new Date('9999-12-31');
      return s && !(s > qEnd || e < qStart);
    }

    // fetch residents for status checks
    const resRes = await fetch(`${API_ROOT}/residents`);
    const residents = resRes.ok ? (await resRes.json()).data || [] : [];
    const statusById = new Map();
    residents.forEach(r => statusById.set(String(r.MANHANKHAU), (r.TRANGTHAI || r.trangthai || '').toString()));

    const ttFiltered = ttData.filter(r => overlaps(r) && (statusById.get(String(r.MANHANKHAU)) || '') !== 'DaQuaDoi' && (statusById.get(String(r.MANHANKHAU)) || '') !== 'ChuyenDi');
    const tvFiltered = tvData.filter(r => overlaps(r) && (statusById.get(String(r.MANHANKHAU)) || '') !== 'DaQuaDoi' && (statusById.get(String(r.MANHANKHAU)) || '') !== 'ChuyenDi');

    function uniqueById(arr) {
      const m = new Map();
      arr.forEach(r => { const id = String(r.MANHANKHAU || ''); if (!id) return; if (!m.has(id)) m.set(id, r); });
      return Array.from(m.values());
    }
    const ttList = uniqueById(ttFiltered);
    const tvList = uniqueById(tvFiltered);

    if (ttList.length === 0 && tvList.length === 0) { alert('Không có dữ liệu để xuất'); return; }

    // build HTML with counts and separate sections
    const headerHtml = `<h1>${escapeHtml(title)}</h1>` +
      (start || end ? `<p><strong>Khoảng thời gian:</strong> ${escapeHtml(formatDate(start) || '')}${start && end ? ' — ' : ''}${escapeHtml(formatDate(end) || '')}</p>` : '') +
      `<p><strong>Tổng số người đang tạm trú:</strong> ${ttList.length} &nbsp;&nbsp; <strong>Tổng số nhân khẩu đang tạm vắng:</strong> ${tvList.length}</p>`; 

    function buildTable(list, type) {
      if (!list || list.length === 0) return '<p>Không có bản ghi</p>';
      const rowsHtml = list.map(e => `
        <tr>
          <td>${escapeHtml(e.HOTEN || '')}</td>
          <td>${escapeHtml(e.MANHANKHAU || '')}</td>
          <td>${escapeHtml(e.CCCD || '')}</td>
          <td>${escapeHtml(e.DIACHITAMTRU || e.NOITAMTRU || '')}</td>
          <td>${escapeHtml(formatDate(e.NGAYBATDAU || e.NGAY_BAT_DAU || e.NGAY_BIEN_DONG || ''))}</td>
          <td>${escapeHtml(formatDate(e.NGAYKETTHUC || e.NGAY_KET_THUC || ''))}</td>
          <td>${escapeHtml(e.GHICHU || e.LYDO || '')}</td>
          <td>${escapeHtml(computeRealTimeStatus(e, type) || '')}</td>
        </tr>
      `).join('');
      return `
        <table>
          <thead>
            <tr><th>Họ tên</th><th>Mã NK</th><th>CCCD</th><th>Nơi</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Ghi chú</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;
    }

    const ttTable = `<h3>Danh sách Tạm trú (${ttList.length})</h3>` + buildTable(ttList, 'tamtru');
    const tvTable = `<h3>Danh sách Tạm vắng (${tvList.length})</h3>` + buildTable(tvList, 'tamvang');

    const w = window.open('', '', 'width=900,height=700');
    w.document.write(`<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial, "Helvetica Neue", Helvetica, sans-serif;padding:20px;color:#000}h1{font-size:18px}h3{margin-top:18px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{padding:8px;border:1px solid #ccc;text-align:left}th{background:#f5f5f5}</style></head><body>`);
    w.document.write(headerHtml);

    // include chart if exists
    try {
      const canvas = document.getElementById('reportChart');
      if (canvas && typeof canvas.toDataURL === 'function') {
        const img = canvas.toDataURL('image/png');
        w.document.write(`<div><img src="${img}" style="max-width:100%;height:auto;margin-bottom:12px"/></div>`);
      }
    } catch (e) { /* ignore */ }

    w.document.write(ttTable);
    w.document.write(tvTable);
    w.document.write('</body></html>');
    w.document.close();
    setTimeout(() => w.print(), 400);
    return;
  }

  // default: print current summary table and chart
  const w = window.open('', '', 'width=900,height=700');
  const tableHtml = document.querySelector('.report-table-data').outerHTML;
  const nowStr = formatDateTime(new Date());
  w.document.write(`<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial, "Helvetica Neue", Helvetica, sans-serif;padding:20px;color:#000}h1{font-size:18px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ccc}</style></head><body>`);
  w.document.write(`<h1>${escapeHtml(title)}</h1>`);
  w.document.write(`<p><strong>Tính đến:</strong> ${escapeHtml(nowStr)}</p>`);
  try {
    const canvas = document.getElementById('reportChart');
    if (canvas && typeof canvas.toDataURL === 'function') {
      const img = canvas.toDataURL('image/png');
      w.document.write(`<div><img src="${img}" style="max-width:100%;height:auto;margin-bottom:12px"/></div>`);
    }
  } catch (e) { /* ignore */ }
  w.document.write(tableHtml);
  w.document.write('</body></html>');
  w.document.close();
  setTimeout(() => w.print(), 400);
}
