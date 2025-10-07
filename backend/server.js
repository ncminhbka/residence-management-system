// backend/server.js
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

//route authorization: xac thuc
const authRoutes = require('./routes/auth');
const auth = require('./middleware/auth');
const authController = require('./controller/authController');
//database
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

//middleware: body parser + cookie parser
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth', authRoutes);

// Protected API
app.get('/api/dashboard', auth, authController.getDashboard );

// đây chính là code hiển thị frontend
// Serve frontend static files from ../frontend phục vụ file tĩnh
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// For any other route, serve index.html (SPA fallback not necessary here but safe) tức là nếu người dùng có sửa url thì nó vẫn sẽ trả về trang index.html
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => console.log(`App running at http://localhost:${PORT}`));

// chú ý app.use được chạy theo thứ tự từ trên xuống dưới
// nên các route API phải đặt trước phần static file
// nếu không sẽ bị ghi đè bởi static file và không thể hoạt động được