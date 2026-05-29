const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const menuRoutes = require('./routes/menuRoutes');
app.use('/api/menu', menuRoutes);

const tableRoutes = require('./routes/tableRoutes');
app.use('/api/tables', tableRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payment', paymentRoutes);

const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

const reportRoutes = require('./routes/reportRoutes');
app.use('/api/reports', reportRoutes);

const customerRoutes = require('./routes/customerRoutes');
app.use('/api/customers', customerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
  

  // Thiết lập công việc chạy ngầm quét dọn bàn đặt trước quá 30 phút hàng phút
  setInterval(async () => {
    try {
      const db = require('./config/db');
      const [result] = await db.query(`
        UPDATE tables 
        SET status = 'trong', reserved_at = NULL 
        WHERE status = 'da_dat' AND reserved_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
      `);
      if (result.affectedRows > 0) {
        console.log(`[Hệ thống quét dọn] Đã giải phóng ${result.affectedRows} bàn đặt trước quá 30 phút mà khách không tới.`);
      }
    } catch (err) {
      console.error('Lỗi khi quét dọn bàn đặt trước hết hạn:', err.message);
    }
  }, 10000); // Quét mỗi 10 giây cho nhạy và chính xác
});
