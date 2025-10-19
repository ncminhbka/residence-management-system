// layout.js — dùng chung cho mọi trang

// === Hàm tải nội dung động (AJAX) ===
async function loadContent(url) {
    const contentSection = document.querySelector(".content");

    if (!contentSection) return;

    // 1. Thêm một class loading để tạo hiệu ứng/che giấu giật nhẹ
    // Bạn cần thêm CSS cho class .content.loading { opacity: 0.5; transition: opacity 0.3s; }
    contentSection.classList.add("loading"); 

    try {
        // 2. Fetch nội dung trang mới (chỉ lấy phần HTML cần thiết)
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Không thể tải nội dung: ${url}`);
        }
        
        const newHTML = await response.text();
        
        // 3. Thay thế nội dung cũ bằng nội dung mới
        contentSection.innerHTML = newHTML;
        
        // 4. Cập nhật URL trình duyệt (không tải lại)
        window.history.pushState({}, '', url);

    } catch (error) {
        console.error("Lỗi khi tải nội dung trang:", error);
        contentSection.innerHTML = `<p style="color: red;">Đã xảy ra lỗi khi tải nội dung.</p>`;
    } finally {
        // 5. Xóa class loading
        contentSection.classList.remove("loading");
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    // 1️⃣ Nạp navbar và sidebar từ partials
    await loadLayout();

    // 2️⃣ Sau khi layout sẵn sàng, gọi API user và thiết lập sự kiện menu
    await initUserAndMenu();
});

// === Hàm nạp giao diện navbar + sidebar ===
async function loadLayout() {
    // Thêm navbar vào đầu body
    const navbarHTML = await fetch("partials/navbar.html").then(res => res.text());
    document.body.insertAdjacentHTML("afterbegin", navbarHTML);

    // Nếu chưa có main, tạo main
    let main = document.querySelector("main");
    if (!main) {
        main = document.createElement("main");
        main.className = "dashboard";
        document.body.appendChild(main);
    }

    // Thêm sidebar vào đầu main
    const sidebarHTML = await fetch("partials/sidebar.html").then(res => res.text());
    main.insertAdjacentHTML("afterbegin", sidebarHTML);

    setupLayoutEvents();
}

// === Hàm gắn sự kiện toggle + logout ===
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

    // Giữ trạng thái sidebar
    const wasHidden = localStorage.getItem("sidebarHidden") === "true";
    if (wasHidden) sidebar.classList.add("hidden");
}

// === Hàm khởi tạo user + menu ===
async function initUserAndMenu() {
    try {
        const res = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!res.ok) throw new Error("Token không hợp lệ");

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

        // Sinh menu theo vai trò và gắn sự kiện AJAX
        renderMenu(role);
        
        // Tải nội dung trang ban đầu (ví dụ: dashboard.html)
        const currentPath = window.location.pathname.split("/").pop();
        if (currentPath && currentPath !== 'index.html') {
             // Giả định trang hiện tại là trang mặc định khi tải lần đầu
        } else {
             // Nếu là trang mặc định sau khi đăng nhập (ví dụ: index.html), chuyển sang dashboard.html
             // Bạn có thể tùy chỉnh trang mặc định này
             loadContent('dashboard.html');
        }

    } catch (err) {
        console.error(err);
        window.location.href = "index.html";
    }
}

// === Hàm sinh menu động theo vai trò (ĐÃ THAY ĐỔI) ===
function renderMenu(role) {
    const menu = document.getElementById("menu");
    if (!menu) return;

    const menuItems = [
        { name: "Dashboard", href: "dashboard.html", roles: ["ALL"] },
        { name: "Quản lý hộ khẩu", href: "households.html", roles: ["TO_TRUONG", "TO_PHO"] },
        { name: "Quản lý nhân khẩu", href: "citizens.html", roles: ["TO_TRUONG", "TO_PHO"] },
        { name: "Tạm trú / Tạm vắng", href: "temp.html", roles: ["TO_TRUONG", "TO_PHO"] },
        { name: "Thống kê & Báo cáo", href: "reports.html", roles: ["TO_TRUONG", "TO_PHO"] },
        { name: "Quản lý tài khoản", href: "accounts.html", roles: ["TO_TRUONG","TO_PHO"] },
        { name: "Quản lý nhà văn hóa", href: "nvh.html", roles: ["TO_TRUONG","TO_PHO", "CAN_BO_NGHIEP_VU"] },
    ];

    menu.innerHTML = "";

    menuItems.forEach(item => {
        if (item.roles.includes("ALL") || item.roles.includes(role)) {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = item.href;
            a.textContent = item.name;

            // Gắn sự kiện AJAX thay vì tải lại trang (QUAN TRỌNG)
            a.addEventListener('click', (e) => {
                e.preventDefault(); // Ngăn hành vi mặc định của thẻ <a>
                loadContent(item.href);
                
                // Cập nhật trạng thái active
                menu.querySelectorAll('a').forEach(link => link.classList.remove('active'));
                a.classList.add('active');
            });

            li.appendChild(a);
            menu.appendChild(li);
        }
    });

    // Đánh dấu trang hiện tại
    const current = window.location.pathname.split("/").pop() || 'dashboard.html'; 
    const currentLink = Array.from(menu.querySelectorAll("a")).find(a => a.getAttribute("href") === current);
    if (currentLink) currentLink.classList.add("active");
}