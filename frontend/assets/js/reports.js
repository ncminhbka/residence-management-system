// frontend/assets/js/reports.js

const API_ROOT = '/api/v1';
let currentChart = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnViewReport').addEventListener('click', onViewReport);
  document.getElementById('btnExportExcel').addEventListener('click', onExportExcel);
  document.getElementById('btnExportPdf').addEventListener('click', onExportPdf);
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
    else if (type === 'tamtru_tamvang') await renderTamTruTamVangReport();
  } catch (err) {
    console.error('Report error', err);
    showTableMessage('Lỗi khi tải báo cáo: ' + (err.message || err));
  }
}

function showTableMessage(msg) {
  const tbody = document.querySelector('#detailedReportTable tbody');
  tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#c00; padding:16px">${msg}</td></tr>`;
}

function escapeHtml(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

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
      <td style="text-align:right; padding:10px">${(r.percent!==undefined? r.percent.toFixed(2) : '')}</td>
    </tr>
  `).join('');
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
    options: Object.assign({ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function(ctx) { const v = ctx.raw || 0; return `${ctx.label}: ${v}`; } } } } }, options)
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
    options: Object.assign({ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } } }, options)
  });
}

function generateColors(n) {
  const base = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ac'];
  const out = [];
  for (let i=0;i<n;i++) out.push(base[i % base.length]);
  return out;
}

// Report implementations
async function renderGenderReport() {
  showTableMessage('Đang tải dữ liệu...');
  const res = await fetch(`${API_ROOT}/residents`);
  if (!res.ok) throw new Error('Không thể tải danh sách nhân khẩu (yêu cầu đăng nhập?)');
  const json = await res.json();
  const data = Array.isArray(json) ? json : (json.data || []);

  const counts = {};
  data.forEach(r => {
    const g = (r.GIOITINH || r.gioitinh || 'Khác').toString();
    counts[g] = (counts[g]||0) + 1;
  });
  const labels = Object.keys(counts);
  const values = labels.map(l=>counts[l]);
  const total = values.reduce((a,b)=>a+b,0) || 1;
  const rows = labels.map((lab,i)=>({ label: lab, count: values[i], percent: values[i]*100/total }));

  // Draw as pie for visual
  drawPieChart(labels, values, { plugins: { legend: { position: 'bottom' } } });
  renderTableRows(rows);
}

async function renderAgeReport() {
  showTableMessage('Đang tải dữ liệu...');
  const res = await fetch(`${API_ROOT}/residents`);
  if (!res.ok) throw new Error('Không thể tải danh sách nhân khẩu (yêu cầu đăng nhập?)');
  const json = await res.json();
  const data = Array.isArray(json) ? json : (json.data || []);

  const groups = { '0-14':0, '15-24':0, '25-64':0, '65+':0 };
  const now = new Date();
  data.forEach(r=>{
    const dob = r.NGAYSINH || r.ngaysinh;
    if (!dob) return;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return;
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    if (age <= 14) groups['0-14']++;
    else if (age <=24) groups['15-24']++;
    else if (age <=64) groups['25-64']++;
    else groups['65+']++;
  });

  const labels = Object.keys(groups);
  const values = labels.map(l=>groups[l]);
  const total = values.reduce((a,b)=>a+b,0) || 1;
  const rows = labels.map((lab,i)=>({ label: lab, count: values[i], percent: values[i]*100/total }));

  drawBarChart(labels, values, { scales: { y: { beginAtZero: true } } });
  renderTableRows(rows);
}

async function renderBiendongReport(start, end) {
  showTableMessage('Đang tải dữ liệu...');
  const [tvRes, ttRes] = await Promise.all([
    fetch(`${API_ROOT}/residencechanges/tamvang`),
    fetch(`${API_ROOT}/residencechanges/tamtru`)
  ]);

  const tvJson = tvRes.ok ? await tvRes.json().catch(()=>({data:[]})) : {data:[]};
  const ttJson = ttRes.ok ? await ttRes.json().catch(()=>({data:[]})) : {data:[]};
  const tvData = tvJson.data || [];
  const ttData = ttJson.data || [];

  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  function inRange(dateStr) {
    if(!dateStr) return false;
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
  const rows = labels.map((lab,i)=>({ label: lab, count: values[i], percent: values[i] * 100 / ((values[0] + values[1]) || 1) }));

  drawBarChart(labels, values, { plugins: { legend: { display: false } } });
  renderTableRows(rows);
}

async function renderTamTruTamVangReport() {
  showTableMessage('Đang tải dữ liệu...');
  const res = await fetch(`${API_ROOT}/residencechanges/stats`);
  if (!res.ok) throw new Error('Không thể tải thống kê tạm trú/tạm vắng');
  const json = await res.json();
  const d = json.data || {};
  const labels = ['Tạm trú đang hoạt động','Tạm trú sắp hết hạn','Đang tạm vắng','Đã trở về'];
  const values = [d.tamTruActive||0, d.tamTruExpiring||0, d.tamVangActive||0, d.tamVangReturned||0];
  const total = values.reduce((a,b)=>a+b,0) || 1;
  const rows = labels.map((lab,i)=>({ label: lab, count: values[i], percent: values[i]*100/total }));

  drawPieChart(labels, values, { plugins: { legend: { position: 'bottom' } } });
  renderTableRows(rows);
}

// Export functions
function onExportExcel() {
  const rows = Array.from(document.querySelectorAll('#detailedReportTable tbody tr'));
  if (rows.length === 0) { alert('Không có dữ liệu để xuất'); return; }
  const csv = [];
  csv.push(['Chỉ mục','Số lượng','Tỷ lệ (%)'].join(','));
  rows.forEach(r => {
    const cols = Array.from(r.querySelectorAll('td')).map(td => '"' + td.innerText.replace(/"/g,'""') + '"');
    csv.push(cols.join(','));
  });
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${document.getElementById('reportType').value}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function onExportPdf() {
  const w = window.open('', '', 'width=900,height=700');
  const title = document.getElementById('currentReportTitle').textContent;
  const tableHtml = document.querySelector('.report-table-data').outerHTML;
  w.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}h1{font-size:18px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ccc}</style></head><body>`);
  w.document.write(`<h1>${title}</h1>`);
  // include chart image if available
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
  setTimeout(()=>w.print(), 400);
}

