document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  // 🧹 Reset form login
  function resetLoginForm() {
    loginForm.reset();
    loginError.textContent = '';
  }

  // 🔐 Xử lý Đăng nhập
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        loginError.textContent = data.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        return;
      }

      // ✅ Chuyển sang dashboard
      window.location.href = 'dashboard.html';
    } catch (err) {
      loginError.textContent = 'Lỗi kết nối máy chủ. Vui lòng thử lại.';
    }
  });
});
