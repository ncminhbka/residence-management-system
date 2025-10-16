document.addEventListener("DOMContentLoaded", async () => {
  // Chờ layout load xong (navbar + sidebar)
  await initLayoutAndAuth();

  const tableBody = document.querySelector("#accountsTable tbody");
  const form = document.getElementById("createAccountForm");
  const msg = document.getElementById("accountMessage");

  // ======= HÀM: Load danh sách tài khoản =======
  async function loadAccounts() {
    tableBody.innerHTML = "<tr><td colspan='6'>Đang tải...</td></tr>";
    try {
      const res = await fetch("/api/v1/accounts", { credentials: "include" });
      if (!res.ok) throw new Error("Không thể tải danh sách tài khoản");
      const accounts = await res.json();

      if (accounts.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='6'>Chưa có tài khoản nào</td></tr>";
        return;
      }

      tableBody.innerHTML = "";
      accounts.forEach((acc) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${acc.MATAIKHOAN}</td>
          <td>${acc.HOTEN}</td>
          <td>${acc.TENDANGNHAP}</td>
          <td>
            <select class="role-select" data-id="${acc.MATAIKHOAN}">
              <option value="TO_TRUONG" ${acc.CHUCVU === "TO_TRUONG" ? "selected" : ""}>Tổ trưởng</option>
              <option value="TO_PHO" ${acc.CHUCVU === "TO_PHO" ? "selected" : ""}>Tổ phó</option>
              <option value="CAN_BO_NGHIEP_VU" ${acc.CHUCVU === "CAN_BO_NGHIEP_VU" ? "selected" : ""}>Cán bộ nghiệp vụ</option>
            </select>
          </td>
          <td>
            <button class="toggle-btn" data-id="${acc.MATAIKHOAN}" data-active="${acc.ACTIVE}">
              ${acc.ACTIVE ? "🟢 Kích hoạt" : "🔴 Vô hiệu"}
            </button>
          </td>
          <td>
            <button class="reset-btn" data-id="${acc.MATAIKHOAN}">Đặt lại mật khẩu</button>
            <button class="delete-btn" data-id="${acc.MATAIKHOAN}">Xóa</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = "<tr><td colspan='6'>Lỗi khi tải dữ liệu.</td></tr>";
    }
  }

  await loadAccounts();

  // ======= HÀM: Tạo tài khoản =======
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const hoten = document.getElementById("hoten").value.trim();
    const tendangnhap = document.getElementById("tendangnhap").value.trim();
    const matkhau = document.getElementById("matkhau").value;
    const chucvu = document.getElementById("chucvu").value;

    try {
      const res = await fetch("/api/v1/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ hoten, tendangnhap, matkhau, chucvu }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      msg.style.color = "green";
      msg.textContent = "✅ Tạo tài khoản thành công!";
      form.reset();
      loadAccounts();
    } catch (err) {
      msg.style.color = "red";
      msg.textContent = "❌ " + err.message;
    }
  });

  // ======= HÀM: Xử lý các nút trong bảng =======
  tableBody.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    // Xóa
    if (e.target.classList.contains("delete-btn")) {
      if (confirm("Bạn có chắc muốn xóa tài khoản này?")) {
        await fetch(`/api/v1/accounts/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        loadAccounts();
      }
    }

    // Đặt lại mật khẩu
    if (e.target.classList.contains("reset-btn")) {
      const newPass = prompt("Nhập mật khẩu mới:");
      if (newPass) {
        await fetch(`/api/v1/accounts/${id}/reset-password`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ new_password: newPass }),
        });
        alert("Đã đặt lại mật khẩu!");
      }
    }

    // Kích hoạt / vô hiệu hóa
    if (e.target.classList.contains("toggle-btn")) {
      await fetch(`/api/v1/accounts/${id}/toggle`, {
        method: "PUT",
        credentials: "include",
      });
      loadAccounts();
    }
  });

  // ======= HÀM: Cập nhật quyền =======
  tableBody.addEventListener("change", async (e) => {
    if (e.target.classList.contains("role-select")) {
      const id = e.target.dataset.id;
      const newRole = e.target.value;
      await fetch(`/api/v1/accounts/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chucvu: newRole }),
      });
      alert("Cập nhật quyền thành công!");
    }
  });
});
