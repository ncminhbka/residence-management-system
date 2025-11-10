// === layout.js ===

document.addEventListener("DOMContentLoaded", async () => {
  await loadLayout();     // Tải navbar + sidebar
  await checkAuth();      // Kiểm tra đăng nhập
  setupLayoutEvents();    // Gắn sự kiện toggle, logout, v.v.
});

// --- Tải layout tĩnh ---
async function loadLayout() {
  const navbarHTML = await fetch("partials/navbar.html").then(res => res.text());
  document.getElementById("navbar").innerHTML = navbarHTML;

  const sidebarHTML = await fetch("partials/sidebar.html").then(res => res.text());
  document.getElementById("sidebar").innerHTML = sidebarHTML;
}

// --- Kiểm tra đăng nhập ---
async function checkAuth() {
  try {
    const res = await fetch("/api/v1/auth/me", { credentials: "include" });
    if (!res.ok) throw new Error();

    const user = await res.json();
    const usernameEl = document.getElementById("username");
    const roleEl = document.getElementById("role");

    if (usernameEl) usernameEl.textContent = user.username;
    if (roleEl) roleEl.textContent =
      user.role === "TO_TRUONG" ? "Tổ trưởng" :
        user.role === "TO_PHO" ? "Tổ phó" :
          "Cán bộ nghiệp vụ";

    renderMenu(user.role);
  } catch {
    // Nếu chưa đăng nhập thì về trang login
    window.location.href = "index.html";
  }
}

// --- Gắn sự kiện toggle và logout ---
function setupLayoutEvents() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("menuToggle");
  const logoutBtn = document.getElementById("logoutBtn");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
      localStorage.setItem("sidebarHidden", sidebar.classList.contains("hidden"));
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "index.html";
    });
  }

  const wasHidden = localStorage.getItem("sidebarHidden") === "true";
  if (wasHidden) sidebar.classList.add("hidden");
}

// --- Sinh menu ---
function renderMenu(role) {
  const menu = document.getElementById("menu");
  if (!menu) return;

  const items = [
    { name: "Dashboard", href: "dashboard.html", roles: ["ALL"] },
    { name: "Quản lý hộ khẩu", href: "households.html", roles: ["TO_TRUONG", "TO_PHO"] },
    { name: "Quản lý nhân khẩu", href: "residents.html", roles: ["TO_TRUONG", "TO_PHO"] },
    { name: "Tạm trú / Tạm vắng", href: "temp.html", roles: ["TO_TRUONG", "TO_PHO"] },
    { name: "Thống kê & Báo cáo", href: "reports.html", roles: ["TO_TRUONG", "TO_PHO"] },
    { name: "Quản lý tài khoản", href: "accounts.html", roles: ["TO_TRUONG", "TO_PHO"] },
    { name: "Nhà văn hoá", href: "nvh.html", roles: ["TO_TRUONG", "TO_PHO", "CAN_BO_NGHIEP_VU"] },
  ];

  menu.innerHTML = items
    .filter(i => i.roles.includes("ALL") || i.roles.includes(role))
    .map(i => `<li><a href="${i.href}" class="${isActive(i.href) ? "active" : ""}">${i.name}</a></li>`)
    .join("");
}

// --- Trang hiện tại ---
function isActive(href) {
  const current = window.location.pathname.split("/").pop();
  return current === href;
}
