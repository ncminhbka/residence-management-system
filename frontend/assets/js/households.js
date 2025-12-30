const API_BASE_URL = '/api/v1/households';
let allHouseholds = [];
let currentPage = 1;
const rowsPerPage = 10;

// State cho tách hộ
let splitHouseholdMembers = [];
let memberRelations = {};


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
    document.body.addEventListener('click', function (e) {
        const closeBtn = e.target.closest('.close-btn');
        if (!closeBtn) return;

        const modalId = closeBtn.dataset.modal;
        if (modalId) {
            closeModal(modalId);
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


document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchHouseholds();
    
    // Kiểm tra xem có yêu cầu đổi chủ hộ từ trang residents không
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const householdId = urlParams.get('household');
    
    if (action === 'changeowner' && householdId) {
        // Tự động mở modal chi tiết hộ khẩu
        setTimeout(() => {
            handleViewDetails(householdId);
            
            // Hiển thị thông báo
            setTimeout(() => {
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ffc107;
                    color: #856404;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 10001;
                    max-width: 400px;
                    animation: slideIn 0.3s ease;
                `;
                notification.innerHTML = `
                    <strong>Vui lòng đổi chủ hộ</strong><br>
                    <small>Sau khi đổi chủ hộ xong, bạn có thể quay lại cập nhật trạng thái nhân khẩu.</small>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.remove();
                }, 5000);
            }, 500);
        }, 500);
        
        // Xóa params khỏi URL
        window.history.replaceState({}, document.title, 'households.html');
    }
});


function openAddModal() {
    document.getElementById('household-form').reset();
    const title = document.getElementById('modal-title') || document.getElementById('household-form-title');
    if (title) title.textContent = 'Thêm Hộ Khẩu Mới';

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
        const availableResidents = result.data.filter(r =>
            !r.SOHOKHAU && r.TRANGTHAI !== 'DaQuaDoi' && r.TRANGTHAI !== 'ChuyenDi'
        );

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

// ============================================
// XÓA THÀNH VIÊN KHỎI HỘ (MỚI)
// ============================================
function openRemoveMemberModal(sohokhau, manhankhau, memberName) {
    const oldModal = document.getElementById('remove-member-modal');
    if (oldModal) oldModal.remove();

    const html = `
        <div class="modal-overlay" id="remove-member-modal" style="display: flex;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header" style="background: #dc3545;">
                    <h3>⚠️ Xác nhận xóa thành viên</h3>
                    
                </div>
                <div class="modal-body" style="background: var(--panel-bg); padding: 20px;">
                    <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 15px;">
                        <p style="margin: 0; color: #856404;">
                            <strong>⚠️ Cảnh báo:</strong><br>
                            Bạn đang thực hiện thao tác <strong>xóa thành viên</strong> khỏi hộ khẩu.
                        </p>
                    </div>
                    
                    <p style="margin: 15px 0;">
                        <strong>Thành viên:</strong> <span style="color: #dc3545;">${memberName}</span><br>
                        <strong>Mã nhân khẩu:</strong> ${manhankhau}
                    </p>
                    
                    <div class="form-group">
                        <label><strong>Lý do xóa:</strong></label>
                        <textarea id="remove-reason" rows="3" class="form-control" 
                            placeholder="Nhập lý do xóa thành viên (không bắt buộc)..."
                            style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px;"></textarea>
                    </div>
                    
                    <p style="color: #6c757d; font-size: 13px; margin-top: 10px;">
                        💡 <em>Lưu ý: Thành viên sẽ được đánh dấu "Đã rời hộ" và có thể thêm vào hộ khác sau này.</em>
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('remove-member-modal').remove()">Hủy</button>
                    <button class="btn btn-danger" onclick="confirmRemoveMember(${sohokhau}, ${manhankhau})">
                        Xác nhận xóa
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function confirmRemoveMember(sohokhau, manhankhau) {
    const reason = document.getElementById('remove-reason').value.trim() || 'Không rõ lý do';

    try {
        const response = await fetch(`${API_BASE_URL}/${sohokhau}/remove-member`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ manhankhau, lydo: reason })
        });

        const result = await response.json();

        if (result.success) {
            showAlert('✅ ' + result.message, 'success');
            document.getElementById('remove-member-modal').remove();
            closeModal('detail-modal');
            fetchHouseholds();
        } else {
            showAlert('❌ ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Remove member error:', error);
        showAlert('❌ Lỗi: ' + error.message, 'error');
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
        if (title) title.textContent = 'Sửa Hộ Khẩu';

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

// ============================================
// ĐỔI CHỦ HỘ - HIỂN THỊ TẤT CẢ THÀNH VIÊN 
// ============================================
async function handleChangeOwner(sohokhau) {
    const members = await getHouseholdMembers(sohokhau);
    if (!members || members.length === 0) return showAlert('Hộ không có thành viên', 'error');

    // [QUAN TRỌNG] Lưu danh sách thành viên vào biến toàn cục để dùng ở hàm khác
    window.currentHouseholdMembers = members;

    const currentOwner = members.find(m => m.LA_CHU_HO);
    const otherMembers = members.filter(m => !m.LA_CHU_HO);

    if (otherMembers.length === 0) return showAlert('Không có thành viên khác để đổi', 'warning');

    const oldModal = document.getElementById('change-owner-modal');
    if (oldModal) oldModal.remove();

    const html = `
        <div class="modal-overlay" id="change-owner-modal" style="display: flex;">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>🔄 Đổi chủ hộ</h3>
                </div>
                <div class="modal-body" style="background: var(--panel-bg); max-height: 70vh; overflow-y: auto;">
                    <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
                        <p style="margin: 0;"><strong>👤 Chủ hộ hiện tại:</strong> ${currentOwner ? currentOwner.HOTEN : 'N/A'}</p>
                    </div>
                    
                    <div class="form-group">
                        <label><strong>Chọn chủ hộ mới:</strong></label>
                        <select id="new-owner-select" class="form-control" onchange="showRelationUpdateSection()" style="padding: 10px;">
                            <option value="">-- Chọn thành viên --</option>
                            ${otherMembers.map(m => `<option value="${m.MANHANKHAU}">${m.HOTEN} (${m.QUANHECHUHO || 'N/A'})</option>`).join('')}
                        </select>
                    </div>
                    
                    <div id="relation-update-section" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 2px solid #007bff;">
                        <h4 style="margin: 0 0 15px 0; font-size: 16px; color: #0056b3;">
                            📝 Cập nhật quan hệ các thành viên với chủ hộ mới
                        </h4>
                        
                        <div style="background: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #ffc107;">
                            <small style="color: #856404;">
                                💡 <strong>Lưu ý:</strong> Vui lòng cập nhật quan hệ của các thành viên với chủ hộ mới. 
                            </small>
                        </div>
                        
                        <div class="form-group" style="background: var(--panel-bg); padding: 15px; border-radius: 6px; margin-bottom: 12px; border: 1px solid var(--panel-border);">
                            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="font-weight: 600; color: #dc3545;">👤 ${currentOwner ? currentOwner.HOTEN : ''}</span>
                                <span style="background: #ffc107; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">CHỦ HỘ CŨ</span>
                            </label>
                            <select id="old-owner-relation" class="form-control" style="padding: 8px;">
                                <option value="">-- Chọn quan hệ --</option>
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
                        
                        <div id="other-members-relations"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('change-owner-modal').remove()">❌ Hủy</button>
                    <button class="btn btn-primary" onclick="confirmChangeOwnerWithRelations(${sohokhau}, ${currentOwner ? currentOwner.MANHANKHAU : null})">
                        ✅ Xác nhận đổi chủ hộ
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function showRelationUpdateSection() {
    const section = document.getElementById('relation-update-section');
    const newOwnerIdStr = document.getElementById('new-owner-select').value;
    const otherMembersContainer = document.getElementById('other-members-relations');

    if (!newOwnerIdStr) {
        section.style.display = 'none';
        return;
    }

    const newOwnerId = parseInt(newOwnerIdStr);
    // Lấy dữ liệu từ biến toàn cục đã gán ở bước 1
    const allMembers = window.currentHouseholdMembers || [];

    // Lọc ra danh sách thành viên cần cập nhật (trừ chủ hộ mới và trừ chủ hộ cũ vì đã có input riêng)
    const membersToUpdate = allMembers.filter(m =>
        m.MANHANKHAU !== newOwnerId && !m.LA_CHU_HO
    );

    otherMembersContainer.innerHTML = membersToUpdate.map(member => `
        <div class="form-group" style="background: var(--panel-bg); padding: 15px; border-radius: 6px; margin-bottom: 12px; border: 1px solid var(--panel-border);">
            <label style="font-weight: 600; color: #495057; margin-bottom: 8px; display: block;">
                👤 ${member.HOTEN}
                <span style="color: #6c757d; font-weight: 400; font-size: 13px;">
                    (Hiện tại: ${member.QUANHECHUHO || 'Chưa rõ'})
                </span>
            </label>
            <select id="member-relation-${member.MANHANKHAU}" class="form-control" style="padding: 8px;">
                <option value="">-- Chọn quan hệ --</option>
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
    `).join('');

    section.style.display = 'block';
}

async function confirmChangeOwnerWithRelations(sohokhau, oldOwnerId) {
    const newOwnerIdStr = document.getElementById('new-owner-select').value;
    if (!newOwnerIdStr) return showAlert('Vui lòng chọn chủ hộ mới', 'warning');

    const newOwnerId = parseInt(newOwnerIdStr);
    const oldOwnerNewRelation = document.getElementById('old-owner-relation').value;

    // Kiểm tra xem đã chọn quan hệ cho chủ hộ cũ chưa
    if (oldOwnerId && !oldOwnerNewRelation) {
        return showAlert('Vui lòng chọn quan hệ mới cho Chủ hộ cũ', 'warning');
    }

    try {
        const members = window.currentHouseholdMembers || [];

        // --- BƯỚC 1: Đổi chủ hộ ---
        const changeOwnerResponse = await fetch(`${API_BASE_URL}/${sohokhau}/change-owner`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ newOwnerId })
        });

        const changeOwnerResult = await changeOwnerResponse.json();
        if (!changeOwnerResult.success) throw new Error(changeOwnerResult.error);

        // --- BƯỚC 2: Cập nhật quan hệ chủ hộ cũ ---
        if (oldOwnerNewRelation && oldOwnerId) {
            await fetch(`${API_BASE_URL}/${sohokhau}/update-relation`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    memberId: oldOwnerId,
                    newRelation: oldOwnerNewRelation
                })
            });
        }

        // --- BƯỚC 3: Cập nhật quan hệ các thành viên khác ---
        // Lấy danh sách những người cần cập nhật (trừ chủ hộ mới và cũ)
        const otherMembers = members.filter(m => m.MANHANKHAU !== newOwnerId && !m.LA_CHU_HO);

        // Duyệt qua từng thành viên và gửi API update
        for (const member of otherMembers) {
            const selectElement = document.getElementById(`member-relation-${member.MANHANKHAU}`);
            // Chỉ cập nhật nếu người dùng đã chọn giá trị
            if (selectElement && selectElement.value) {
                await fetch(`${API_BASE_URL}/${sohokhau}/update-relation`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        memberId: member.MANHANKHAU,
                        newRelation: selectElement.value
                    })
                });
            }
        }

        showAlert('✅ Đổi chủ hộ và cập nhật quan hệ thành công!', 'success');
        document.getElementById('change-owner-modal').remove();
        closeModal('detail-modal');
        fetchHouseholds();

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Lỗi: ' + error.message, 'error');
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
    if (el) el.style.display = checkbox.checked ? 'block' : 'none';
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

// ============================================
// RENDER MODAL CHI TIẾT HỘ KHẨU
// ============================================
function renderDetailModal(household, members) {
    const content = document.getElementById('detail-content');

    const membersHtml = members && members.length
        ? members.map(m => `
            <tr>
                <td>${m.MANHANKHAU}</td>
                <td>
                    ${m.HOTEN} 
                    ${m.LA_CHU_HO ? '<span style="background: #ffc107; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 5px;">CHỦ HỘ</span>' : ''}
                </td>
                <td>${m.GIOITINH}</td>
                <td>${formatDate(m.NGAYSINH)}</td>
                <td>${m.QUANHECHUHO || ''}</td>
                <td>
                    ${!m.LA_CHU_HO
                ? `<button class="btn btn-sm btn-danger" onclick="openRemoveMemberModal(${household.SOHOKHAU}, ${m.MANHANKHAU}, '${m.HOTEN}')">Xóa</button>`
                : '<span style="color: #6c757d; font-size: 12px;">Không thể xóa</span>'
            }
                </td>
            </tr>
        `).join('')
        : '<tr><td colspan="6">Trống</td></tr>';

    content.innerHTML = `
        <div class="info-grid">
            <p><strong>Số hộ khẩu:</strong> ${household.SOHOKHAU}</p>
            <p><strong>Chủ hộ:</strong> ${household.HOTENCHUHO || 'N/A'}</p>
            <p><strong>Địa chỉ:</strong> ${household.DIACHI}</p>
        </div>
        <h4>Danh sách thành viên</h4>
        <table class="data-table small">
            <thead>
                <tr>
                    <th>Mã</th>
                    <th>Tên</th>
                    <th>Giới tính</th>
                    <th>Ngày sinh</th>
                    <th>Quan hệ</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>${membersHtml}</tbody>
        </table>
        <div class="form-actions" style="margin-top:20px;">
            <button class="btn btn-info" onclick="handleViewHistory(${household.SOHOKHAU})">
                <i class="fas fa-history"></i> Xem lịch sử
            </button>
            <button class="btn btn-success" onclick="openAddMemberModal(${household.SOHOKHAU})">Thêm thành viên</button>
            <button class="btn btn-info" onclick="handleChangeOwner(${household.SOHOKHAU})">Đổi chủ hộ</button>
            <button class="btn btn-primary" onclick="handleSplitRequest(${household.SOHOKHAU})">Tách hộ</button>
            <button class="btn btn-secondary close-btn" data-modal="detail-modal"></button>
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



// ============================================
// XEM LỊCH SỬ HỘ KHẨU
// ============================================
async function handleViewHistory(sohokhau) {
    try {
        // Mở modal
        openModal('history-modal');

        // Hiển thị loading
        document.getElementById('history-table-body').innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: var(--primary-color);"></i>
                    <p style="margin-top: 10px; color: var(--text-color-faint);">Đang tải lịch sử...</p>
                </td>
            </tr>
        `;

        // Lấy lịch sử
        const historyRes = await fetch(`${API_BASE_URL}/${sohokhau}/history`, {
            credentials: 'include'
        });
        const historyData = await historyRes.json();

        if (!historyData.success) {
            throw new Error(historyData.error || 'Không thể tải lịch sử');
        }


        renderHistoryTable(historyData.data);

    } catch (error) {
        console.error('View history error:', error);
        showAlert('Lỗi: ' + error.message, 'error');
        document.getElementById('history-table-body').innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle"></i> ${error.message}
                </td>
            </tr>
        `;
    }
}

// Render bảng lịch sử
function renderHistoryTable(history) {
    const tbody = document.getElementById('history-table-body');

    if (!history || history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-color-faint);">
                    <i class="fas fa-inbox" style="font-size: 32px; display: block; margin-bottom: 10px; opacity: 0.5;"></i>
                    Chưa có lịch sử biến động nào
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = history.map((item, index) => {
        const date = formatDate(item.NGAY_BIEN_DONG);
        const type = getHistoryTypeLabel(item.LOAI_BIEN_DONG);
        const badge = getHistoryTypeBadge(item.LOAI_BIEN_DONG);

        return `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${date}</td>
                <td>
                    <span class="badge ${badge}" style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                        ${type}
                    </span>
                </td>
                <td style="line-height: 1.6;">${item.MO_TA || 'Không có mô tả'}</td>
                <td>${item.NGUOI_THUC_HIEN || 'Hệ thống'}</td>
            </tr>
        `;
    }).join('');
}

// Lấy nhãn loại biến động
function getHistoryTypeLabel(type) {
    const labels = {
        'TaoMoi': 'Tạo mới',
        'CapNhatThongTin': 'Cập nhật thông tin',
        'ThemThanhVien': 'Thêm thành viên',
        'XoaThanhVien': 'Xóa thành viên',
        'DoiChuHo': 'Đổi chủ hộ',
        'TachHo': 'Tách hộ',
        'NhapHo': 'Nhập hộ',
        'GiaiHo': 'Giải tán hộ'
    };
    return labels[type] || type;
}

// Lấy class badge theo loại
function getHistoryTypeBadge(type) {
    const badges = {
        'TaoMoi': 'badge-success',
        'CapNhatThongTin': 'badge-info',
        'ThemThanhVien': 'badge-success',
        'XoaThanhVien': 'badge-warning',
        'DoiChuHo': 'badge-info',
        'TachHo': 'badge-warning',
        'NhapHo': 'badge-info',
        'GiaiHo': 'badge-danger'
    };
    return badges[type] || 'badge-secondary';
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
window.handleViewHistory = handleViewHistory;