const API_BASE_URL = '/api/v1/households';
let allHouseholds = [];
let currentPage = 1;
const rowsPerPage = 10;

// State cho tách hộ
let splitHouseholdMembers = [];
let memberRelations = {}; 

// ============================================
// KHỞI TẠO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchHouseholds();
});

// ============================================
// SETUP EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Tìm kiếm
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    document.getElementById('clear-search-btn').addEventListener('click', clearSearch);
    document.getElementById('search-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Thêm hộ khẩu
    document.getElementById('add-household-btn').addEventListener('click', openAddModal);

    // Form submit
    document.getElementById('household-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('split-form').addEventListener('submit', handleSplitSubmit);

    // Xác nhận xóa
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);

    // Đóng modal chung (Click vào nút X hoặc nút Đóng)
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-btn')) {
            const modalId = e.target.getAttribute('data-modal');
            if (modalId) closeModal(modalId);
        }
    });

    // Event delegation cho các nút trong bảng (Xem, Sửa, Xóa)
    document.getElementById('household-table-body').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.getAttribute('data-id');

        if (target.classList.contains('view-btn')) {
            handleViewDetails(id);
        } else if (target.classList.contains('edit-btn')) {
            handleEdit(id);
        } else if (target.classList.contains('delete-btn')) {
            openDeleteModal(id);
        }
    });
}


function openAddModal() {
    document.getElementById('household-form').reset();
    const title = document.getElementById('modal-title') || document.getElementById('household-form-title');
    if(title) title.textContent = 'Thêm Hộ Khẩu Mới';

    document.getElementById('soHoKhau').value = ''; // Reset ID
    document.getElementById('maNhanKhauChuHo').disabled = false; // Cho phép nhập chủ hộ
    openModal('household-modal');
}

// === HÀM MỞ MODAL THÊM THÀNH VIÊN ===
async function openAddMemberModal(sohokhau) {
    try {
        // Lấy danh sách nhân khẩu chưa thuộc hộ nào
        const response = await fetch(`/api/v1/residents`, { credentials: 'include' });
        const result = await response.json();
        
        if (!result.success) throw new Error('Không thể tải danh sách nhân khẩu');
        
        // Lọc những nhân khẩu chưa có hộ (SOHOKHAU = null hoặc undefined)
        const availableResidents = result.data.filter(r => !r.SOHOKHAU);
        
        if (availableResidents.length === 0) {
            showAlert('Không có nhân khẩu nào chưa thuộc hộ khẩu', 'info');
            return;
        }
        
        // Xóa modal cũ nếu tồn tại
        const oldModal = document.getElementById('add-member-modal');
        if (oldModal) oldModal.remove();
        
        const html = `
            <div class="modal-overlay" id="add-member-modal" style="display: flex;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>Thêm thành viên vào hộ khẩu</h3>
                        <button class="close-btn" onclick="document.getElementById('add-member-modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body" style="background: white;">
                        <div class="form-group">
                            <label>Chọn nhân khẩu:</label>
                            <select id="select-member" class="form-control" style="width: 100%; padding: 8px;">
                                <option value="">-- Chọn nhân khẩu --</option>
                                ${availableResidents.map(r => 
                                    `<option value="${r.MANHANKHAU}">${r.HOTEN} - ${r.NGAYSINH ? formatDate(r.NGAYSINH) : 'N/A'} (ID: ${r.MANHANKHAU})</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quan hệ với chủ hộ:</label>
                            <select id="select-relation" class="form-control" style="width: 100%; padding: 8px;">
                                <option value="">-- Chọn --</option>
                                <option value="Vợ">Vợ</option>
                                <option value="Chồng">Chồng</option>
                                <option value="Con">Con</option>
                                <option value="Bố">Bố</option>
                                <option value="Mẹ">Mẹ</option>
                                <option value="Anh">Anh</option>
                                <option value="Chị">Chị</option>
                                <option value="Em">Em</option>
                                <option value="Cháu">Cháu</option>
                                <option value="Ông">Ông</option>
                                <option value="Bà">Bà</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('add-member-modal').remove()">Hủy</button>
                        <button class="btn btn-primary" onclick="confirmAddMember(${sohokhau})">Thêm</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    } catch (error) {
        console.error(error);
        showAlert('Lỗi: ' + error.message, 'error');
    }
}

async function confirmAddMember(sohokhau) {
    const manhankhau = document.getElementById('select-member').value;
    const quanhechuho = document.getElementById('select-relation').value;
    
    if (!manhankhau) return showAlert('Vui lòng chọn nhân khẩu', 'warning');
    if (!quanhechuho) return showAlert('Vui lòng chọn quan hệ với chủ hộ', 'warning');
    
    try {
        const response = await fetch(`${API_BASE_URL}/${sohokhau}/add-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ manhankhau: parseInt(manhankhau), quanhechuho })
        });
        
        const result = await response.json();
        if (result.success) {
            showAlert(result.message, 'success');
            document.getElementById('add-member-modal').remove();
            closeModal('detail-modal');
            fetchHouseholds();
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function handleEdit(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}/details`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Không thể tải thông tin hộ khẩu');

        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        const household = result.data1[0]; // data1 là thông tin hộ, data2 là thành viên

        // Reset và điền form
        document.getElementById('household-form').reset();
        
        const title = document.getElementById('modal-title') || document.getElementById('household-form-title');
        if(title) title.textContent = 'Sửa Hộ Khẩu';
        
        // Điền dữ liệu
        document.getElementById('soHoKhau').value = household.SOHOKHAU;
        document.getElementById('maNhanKhauChuHo').value = household.MACHUHO || household.MANHANKHAU; // Tùy API trả về
        document.getElementById('diaChi').value = household.DIACHI;
        document.getElementById('hoSoSo').value = household.HOSOSO;
        document.getElementById('soDangKySo').value = household.SODANGKYSO;
        document.getElementById('toSo').value = household.TOSO;

        // Disable mã nhân khẩu khi edit (thường không cho sửa chủ hộ ở form này)
        document.getElementById('maNhanKhauChuHo').disabled = true;

        openModal('household-modal');
    } catch (error) {
        console.error('Edit error:', error);
        showAlert(error.message, 'error');
    }
}

function openDeleteModal(id) {
    // Gán ID vào nút xác nhận xóa để hàm confirmDelete biết xóa ai
    document.getElementById('confirm-delete-btn').dataset.id = id;
    openModal('delete-modal');
}

// ============================================
// API CALLS & LOGIC CHÍNH
// ============================================

async function fetchHouseholds() {
    try {
        showLoading();
        const response = await fetch(API_BASE_URL, { credentials: 'include' });
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        const result = await response.json();

        if (result.success) {
            allHouseholds = result.data;
            currentPage = 1;
            displayPage(currentPage);
        } else {
            showEmptyTable();
        }
    } catch (error) {
        console.error(error);
        showEmptyTable();
    }
}

async function handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) {
        showAlert('Vui lòng nhập từ khóa', 'warning');
        return;
    }
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`, { credentials: 'include' });
        const result = await response.json();
        if (result.success && result.data.length > 0) {
            renderHouseholdTable(result.data, 0);
            document.getElementById('pagination-controls').innerHTML = '';
        } else {
            showAlert('Không tìm thấy kết quả', 'info');
            showEmptyTable('Không tìm thấy kết quả');
        }
    } catch (error) {
        showEmptyTable();
    }
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    fetchHouseholds();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const soHoKhau = document.getElementById('soHoKhau').value;
    const isEdit = !!soHoKhau;

    const formData = {
        manhankhauchuho: parseInt(document.getElementById('maNhanKhauChuHo').value),
        diachi: document.getElementById('diaChi').value.trim(),
        hososo: parseInt(document.getElementById('hoSoSo').value),
        sodangkyso: parseInt(document.getElementById('soDangKySo').value),
        toso: parseInt(document.getElementById('toSo').value),
    };

    if (isEdit) delete formData.manhankhauchuho;

    const url = isEdit ? `${API_BASE_URL}/${soHoKhau}` : API_BASE_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (result.success) {
            showAlert(result.message, 'success');
            closeModal('household-modal');
            fetchHouseholds();
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function confirmDelete() {
    const id = document.getElementById('confirm-delete-btn').dataset.id;
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const result = await response.json();
        if (result.success) {
            showAlert(result.message, 'success');
            closeModal('delete-modal');
            fetchHouseholds();
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// ============================================
// XEM CHI TIẾT & ĐỔI CHỦ HỘ
// ============================================

async function handleViewDetails(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}/details`, { credentials: 'include' });
        const result = await response.json();
        if (result.success) {
            renderDetailModal(result.data1[0], result.data2);
            openModal('detail-modal');
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        console.error(error);
    }
}

// --- FIX LỖI MODAL ĐỔI CHỦ HỘ + THÊM CẬP NHẬT QUAN HỆ ---
async function handleChangeOwner(sohokhau) {
    const members = await getHouseholdMembers(sohokhau);
    if (!members || members.length === 0) return showAlert('Hộ không có thành viên', 'error');

    const currentOwner = members.find(m => m.LA_CHU_HO);
    const otherMembers = members.filter(m => !m.LA_CHU_HO);

    if (otherMembers.length === 0) return showAlert('Không có thành viên khác để đổi', 'warning');

    // Xóa modal cũ nếu còn tồn tại để tránh trùng ID
    const oldModal = document.getElementById('change-owner-modal');
    if (oldModal) oldModal.remove();

    const html = `
        <div class="modal-overlay" id="change-owner-modal" style="display: flex;">
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>Đổi chủ hộ</h3>
                    <button class="close-btn" onclick="document.getElementById('change-owner-modal').remove()">&times;</button>
                </div>
                <div class="modal-body" style="background: white; max-height: 70vh; overflow-y: auto;">
                    <p><strong>Chủ hộ hiện tại:</strong> ${currentOwner ? currentOwner.HOTEN : 'N/A'}</p>
                    
                    <div class="form-group">
                        <label>Chọn chủ hộ mới:</label>
                        <select id="new-owner-select" class="form-control" onchange="showRelationUpdateSection()">
                            <option value="">-- Chọn --</option>
                            ${otherMembers.map(m => `<option value="${m.MANHANKHAU}">${m.HOTEN} (${m.QUANHECHUHO || 'N/A'})</option>`).join('')}
                        </select>
                    </div>
                    
                    <!-- Phần cập nhật quan hệ (Mặc định ẩn) -->
                    <div id="relation-update-section" style="display: none; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
                        <h4 style="margin-bottom: 15px; font-size: 16px; color: #495057;">Cập nhật quan hệ các thành viên</h4>
                        
                        <!-- Quan hệ chủ hộ cũ -->
                        <div class="form-group">
                            <label><strong>${currentOwner ? currentOwner.HOTEN : ''}</strong> (Chủ hộ cũ) → Quan hệ mới:</label>
                            <select id="old-owner-relation" class="form-control">
                                <option value="">-- Giữ nguyên --</option>
                                <option value="Bố">Bố</option>
                                <option value="Mẹ">Mẹ</option>
                                <option value="Ông">Ông</option>
                                <option value="Bà">Bà</option>
                                <option value="Vợ">Vợ</option>
                                <option value="Chồng">Chồng</option>
                                <option value="Anh">Anh</option>
                                <option value="Chị">Chị</option>
                                <option value="Em">Em</option>
                                <option value="Con">Con</option>
                                <option value="Cháu">Cháu</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        
                        <!-- Các thành viên khác -->
                        <div id="other-members-relations"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('change-owner-modal').remove()">Hủy</button>
                    <button class="btn btn-primary" onclick="confirmChangeOwnerWithRelations(${sohokhau}, ${currentOwner ? currentOwner.MANHANKHAU : null})">Xác nhận</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

// Hiện phần cập nhật quan hệ khi chọn chủ hộ mới
function showRelationUpdateSection() {
    const section = document.getElementById('relation-update-section');
    const newOwnerId = document.getElementById('new-owner-select').value;
    
    if (newOwnerId) {
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

async function confirmChangeOwnerWithRelations(sohokhau, oldOwnerId) {
    const newOwnerId = document.getElementById('new-owner-select').value;
    if (!newOwnerId) return showAlert('Vui lòng chọn chủ hộ mới', 'warning');

    const oldOwnerNewRelation = document.getElementById('old-owner-relation').value;
    
    try {
        // 1. Đổi chủ hộ
        const changeOwnerResponse = await fetch(`${API_BASE_URL}/${sohokhau}/change-owner`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ newOwnerId: parseInt(newOwnerId) })
        });
        
        const changeOwnerResult = await changeOwnerResponse.json();
        if (!changeOwnerResult.success) throw new Error(changeOwnerResult.error);
        
        // 2. Cập nhật quan hệ chủ hộ cũ (nếu có)
        if (oldOwnerNewRelation && oldOwnerId) {
            await fetch(`${API_BASE_URL}/${sohokhau}/update-relation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    memberId: parseInt(oldOwnerId), 
                    newRelation: oldOwnerNewRelation 
                })
            });
        }
        
        showAlert('Đổi chủ hộ thành công!', 'success');
        document.getElementById('change-owner-modal').remove();
        closeModal('detail-modal');
        fetchHouseholds();
        
    } catch (error) {
        showAlert(error.message, 'error');
    }
}
// ============================================
// LOGIC TÁCH HỘ 
// ============================================

async function handleSplitRequest(soHoKhauGoc) {
    try {
        const response = await fetch(`${API_BASE_URL}/${soHoKhauGoc}/details`, { credentials: 'include' });
        const result = await response.json();
        if (result.success) {
            splitHouseholdMembers = result.data2;
            if (splitHouseholdMembers.length === 0) return showAlert('Không có thành viên để tách', 'warning');
            
            memberRelations = {}; // Reset quan hệ
            document.getElementById('split-form').reset();
            document.getElementById('split-soHoKhauGoc').value = soHoKhauGoc;
            
            renderSplitMembersListWithRelations(splitHouseholdMembers);
            closeModal('detail-modal');
            openModal('split-modal');
        }
    } catch (error) {
        console.error(error);
    }
}

function renderSplitMembersListWithRelations(members) {
    const container = document.getElementById('split-members-list');
    container.innerHTML = '';
    const relations = ['Vợ', 'Chồng', 'Con', 'Bố', 'Mẹ', 'Anh', 'Chị', 'Em', 'Cháu', 'Khác'];

    members.forEach(m => {
        const div = document.createElement('div');
        div.className = 'member-item';
        div.style.cssText = 'padding: 10px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px;';
        div.innerHTML = `
            <label style="display:flex; gap:10px; align-items:center;">
                <input type="checkbox" value="${m.MANHANKHAU}" onchange="handleMemberCheckChange(this, ${m.MANHANKHAU})">
                <span>${m.HOTEN} - ${m.QUANHECHUHO || 'N/A'}</span>
            </label>
            <div id="relation-${m.MANHANKHAU}" style="display:none; margin-top:5px; margin-left:25px;">
                <select class="form-control" onchange="memberRelations[${m.MANHANKHAU}] = this.value">
                    <option value="">-- Quan hệ với chủ hộ MỚI --</option>
                    ${relations.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
            </div>
        `;
        container.appendChild(div);
    });
}

function handleMemberCheckChange(checkbox, memberId) {
    const el = document.getElementById(`relation-${memberId}`);
    if(el) el.style.display = checkbox.checked ? 'block' : 'none';
    if (!checkbox.checked) delete memberRelations[memberId];
}

async function handleSplitSubmit(e) {
    e.preventDefault();
    const sohokhaugoc = parseInt(document.getElementById('split-soHoKhauGoc').value);
    const checked = document.querySelectorAll('#split-members-list input[type="checkbox"]:checked');
    const membersToMove = Array.from(checked).map(cb => parseInt(cb.value));
    const machuhomoi = parseInt(document.getElementById('split-maChuHoMoi').value);

    if (membersToMove.length === 0) return showAlert('Chọn ít nhất 1 thành viên', 'warning');
    if (!membersToMove.includes(machuhomoi)) return showAlert('Chủ hộ mới phải nằm trong danh sách chuyển đi', 'warning');

    const requestBody = {
        sohokhaugoc,
        thongtinhokhaumoi: {
            machuhomoi,
            diachimoi: document.getElementById('split-diaChi').value.trim(),
            hososomoi: parseInt(document.getElementById('split-hoSoSo').value),
            sodangkysomoi: parseInt(document.getElementById('split-soDangKySo').value),
            tosomoi: parseInt(document.getElementById('split-toSo').value),
        },
        thanhviensanghokhaumoi: membersToMove,
        quanheThanhVien: memberRelations
    };

    try {
        const response = await fetch(`${API_BASE_URL}/split`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(requestBody),
        });
        const result = await response.json();
        if (result.success) {
            showAlert('Tách hộ thành công!', 'success');
            closeModal('split-modal');
            fetchHouseholds();
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// ============================================
// CÁC HÀM HỖ TRỢ (RENDERING, UTILS)
// ============================================

function displayPage(page) {
    currentPage = page;
    const start = (currentPage - 1) * rowsPerPage;
    const paginatedItems = allHouseholds.slice(start, start + rowsPerPage);
    renderHouseholdTable(paginatedItems, start);
    renderPagination();
}

function renderHouseholdTable(households, startIndex) {
    const tbody = document.getElementById('household-table-body');
    tbody.innerHTML = '';
    if (households.length === 0) return showEmptyTable();

    households.forEach((hh, index) => {
        const row = `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td>${hh.SOHOKHAU}</td>
                <td>${hh.HOTENCHUHO || 'N/A'}</td>
                <td>${hh.DIACHI}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm view-btn" data-id="${hh.SOHOKHAU}">Xem</button>
                    <button class="btn btn-sm btn-secondary edit-btn" data-id="${hh.SOHOKHAU}">Sửa</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${hh.SOHOKHAU}">Xóa</button>
                </td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function renderDetailModal(household, members) {
    const content = document.getElementById('detail-content');
    const membersHtml = members && members.length 
        ? members.map(m => `<tr><td>${m.MANHANKHAU}</td><td>${m.HOTEN} ${m.LA_CHU_HO ? '(Chủ hộ)' : ''}</td><td>${m.GIOITINH}</td><td>${formatDate(m.NGAYSINH)}</td><td>${m.QUANHECHUHO || ''}</td></tr>`).join('') 
        : '<tr><td colspan="5">Trống</td></tr>';

    content.innerHTML = `
        <div class="info-grid">
            <p><strong>Số hộ khẩu:</strong> ${household.SOHOKHAU}</p>
            <p><strong>Chủ hộ:</strong> ${household.HOTENCHUHO || 'N/A'}</p>
            <p><strong>Địa chỉ:</strong> ${household.DIACHI}</p>
        </div>
        <h4>Thành viên</h4>
        <table class="data-table small"><thead><tr><th>Mã</th><th>Tên</th><th>Giới tính</th><th>Ngày sinh</th><th>Quan hệ</th></tr></thead><tbody>${membersHtml}</tbody></table>
        <div class="form-actions" style="margin-top:20px;">
            <button class="btn btn-success" onclick="openAddMemberModal(${household.SOHOKHAU})">Thêm thành viên</button>
            <button class="btn btn-info" onclick="handleChangeOwner(${household.SOHOKHAU})">Đổi chủ hộ</button>
            <button class="btn btn-primary" onclick="handleSplitRequest(${household.SOHOKHAU})">Tách hộ</button>
            <button class="btn btn-secondary close-btn" data-modal="detail-modal">Đóng</button>
        </div>
    `;
}

// Helpers
async function getHouseholdMembers(id) {
    const res = await fetch(`${API_BASE_URL}/${id}/details`, { credentials: 'include' });
    const json = await res.json();
    return json.success ? json.data2 : [];
}

function formatDate(str) {
    return str ? new Date(str).toLocaleDateString('vi-VN') : 'N/A';
}
function showEmptyTable(msg = 'Không có dữ liệu') {
    document.getElementById('household-table-body').innerHTML = `<tr><td colspan="5">${msg}</td></tr>`;
}
function showLoading() {
    document.getElementById('household-table-body').innerHTML = `<tr><td colspan="5">Đang tải...</td></tr>`;
}
function showAlert(msg, type = 'info') { alert(`${type.toUpperCase()}: ${msg}`); }
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function renderPagination() { /* Logic phân trang giữ nguyên */ 
    const paginationControls = document.getElementById('pagination-controls');
    paginationControls.innerHTML = '';
    const pageCount = Math.ceil(allHouseholds.length / rowsPerPage);
    if (pageCount <= 1) return;
    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.classList.add('page-btn');
        if (i === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => displayPage(i));
        paginationControls.appendChild(btn);
    }
}


// Expose globally
window.handleChangeOwner = handleChangeOwner;
window.showRelationUpdateSection = showRelationUpdateSection;
window.confirmChangeOwnerWithRelations = confirmChangeOwnerWithRelations;
window.handleMemberCheckChange = handleMemberCheckChange;
window.handleSplitRequest = handleSplitRequest;
window.openAddMemberModal = openAddMemberModal;
window.confirmAddMember = confirmAddMember;
window.closeModal = closeModal;