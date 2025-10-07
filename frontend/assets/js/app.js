document.addEventListener('DOMContentLoaded', () => {
  const tabLogin = document.getElementById('tab-login');
  const tabReg = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');

  const loginError = document.getElementById('login-error');
  const regError = document.getElementById('reg-error');
  const regSuccess = document.getElementById('reg-success');

  // 🧹 Hàm reset form login
  function resetLoginForm() {
    loginForm.reset(); // xóa email, password
    loginError.textContent = ''; // xóa lỗi
  }

  // 🧹 Hàm reset form register
  function resetRegisterForm() {
    regForm.reset(); // xóa name, email, password
    regError.textContent = ''; // xóa lỗi
    regSuccess.textContent = ''; // xóa thông báo thành công
  }

  // 🧭 Khi nhấn tab Đăng nhập
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    resetLoginForm(); // 🧹 reset khi chuyển sang
  });

  // 🧭 Khi nhấn tab Đăng ký
  tabReg.addEventListener('click', () => {
    tabReg.classList.add('active');
    tabLogin.classList.remove('active');
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    resetRegisterForm(); // 🧹 reset khi chuyển sang
  });

  // 🔐 Xử lý Đăng nhập
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        loginError.textContent = data.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        return;
      }

      // ✅ Thành công → chuyển thẳng sang dashboard
      window.location = '/dashboard.html';
    } catch (err) {
      loginError.textContent = 'Lỗi kết nối máy chủ. Vui lòng thử lại.';
    }
  });

  // 📝 Xử lý Đăng ký
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    regError.textContent = '';
    regSuccess.textContent = '';

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        regError.textContent = data.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        return;
      }

      // ✅ Đăng ký thành công
      regSuccess.textContent = data.message || 'Đăng ký thành công, đang chuyển về trang đăng nhập...';

      // 🧹 reset form đăng ký
      regForm.reset();

      // ⏳ Sau 2 giây chuyển sang tab Đăng nhập và reset
      setTimeout(() => {
        tabLogin.click();
        resetLoginForm();
      }, 2000);

    } catch (err) {
      regError.textContent = 'Lỗi kết nối máy chủ. Vui lòng thử lại.';
    }
  });
});
