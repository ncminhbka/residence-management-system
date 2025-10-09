// Tải thông tin người dùng khi trang được tải
/*
async function loadUser() {
	try {
		const res = await fetch('/api/v1/dashboard', { credentials: 'include' });
		if (res.status === 401) {
			window.location = '/';
			return;
		}
		const data = await res.json();
		const u = data.user;
		document.getElementById('user-info').innerHTML = `<p>Chào, <b>${u.full_name || u.username}</b></p><p>Username: ${u.username}</p>`;
	} catch (err) {
		document.getElementById('dash-error').textContent = 'Lỗi khi tải thông tin.';
	}
}

//đăng xuất
document.getElementById('btn-logout').addEventListener('click', async () => {
	await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
	window.location = '/';
});
loadUser();
*/
// dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
 
  try {
    // Gọi API kiểm tra token và lấy thông tin user
    const res = await fetch("/api/v1/auth/me", {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Token không hợp lệ");
    }

    const user = await res.json();
    const { username, role } = user;

    // Cập nhật thông tin user
    document.getElementById("username").textContent = username;
    document.getElementById("role").textContent =
      role === "TO_TRUONG"
        ? "Tổ trưởng"
        : role === "TO_PHO"
        ? "Tổ phó"
        : "Cán bộ nghiệp vụ";

    // Sinh menu theo vai trò
    renderMenu(role);
  } catch (err) {
    console.error(err);
    window.location.href = "index.html";
  }

  // Đăng xuất
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = "index.html";
  });
});

function renderMenu(role) {
  const menu = document.getElementById("menu");
  menu.innerHTML = "";

  const menuItems = [
    { name: "Dashboard", href: "dashboard.html", roles: ["ALL"] },
    { name: "Quản lý hộ khẩu", href: "households.html", roles: ["TO_TRUONG", "TO_PHO", "CAN_BO_NGHIEP_VU"] },
    { name: "Quản lý nhân khẩu", href: "citizens.html", roles: ["TO_TRUONG", "TO_PHO", "CAN_BO_NGHIEP_VU"] },
    { name: "Tạm trú / Tạm vắng", href: "temp.html", roles: ["TO_TRUONG", "TO_PHO", "CAN_BO_NGHIEP_VU"] },
    { name: "Thống kê & Báo cáo", href: "reports.html", roles: ["TO_TRUONG", "TO_PHO"] },
    { name: "Quản lý tài khoản", href: "accounts.html", roles: ["TO_TRUONG", "TO_PHO"] },
  ];

  menuItems.forEach(item => {
    if (item.roles.includes("ALL") || item.roles.includes(role)) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${item.href}">${item.name}</a>`;
      menu.appendChild(li);
    }
  });
}

