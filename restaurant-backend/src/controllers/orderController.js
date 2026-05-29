const db = require('../config/db');

// TẠO ORDER MỚI
exports.createOrder = async (req, res) => {
  const { table_id, customer_id } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO orders (table_id, account_id, customer_id) VALUES (?, ?, ?)`,
      [table_id, req.user.id, customer_id || null]
    );
    // Cập nhật trạng thái bàn
    await db.query(
      'UPDATE tables SET status="dang_dung" WHERE id=?', [table_id]
    );
    res.status(201).json({ 
      message: 'Tạo order thành công!', 
      order_id: result.insertId 
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// THÊM MÓN VÀO ORDER
exports.addOrderItem = async (req, res) => {
  const { menu_item_id, quantity, note } = req.body;
  const order_id = req.params.id;
  try {
    // Lấy giá món ăn
    const [menuItem] = await db.query(
      'SELECT price FROM menu_items WHERE id=?', [menu_item_id]
    );
    if (menuItem.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn!' });
    }

    // Kiểm tra xem món này đã được gọi và đang ở trạng thái 'cho' (nháp) chưa
    const [existing] = await db.query(
      'SELECT id, quantity FROM order_items WHERE order_id = ? AND menu_item_id = ? AND status = "cho" LIMIT 1',
      [order_id, menu_item_id]
    );

    if (existing.length > 0) {
      // Cộng dồn số lượng món ăn
      await db.query(
        'UPDATE order_items SET quantity = quantity + ? WHERE id = ?',
        [quantity, existing[0].id]
      );
    } else {
      // Thêm món mới vào order
      await db.query(
        `INSERT INTO order_items 
          (order_id, menu_item_id, quantity, price, note) 
         VALUES (?, ?, ?, ?, ?)`,
        [order_id, menu_item_id, quantity, menuItem[0].price, note || null]
      );
    }

    // Cập nhật tổng tiền
    await updateOrderTotal(order_id);

    res.status(201).json({ message: 'Thêm món thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GỬI ORDER XUỐNG BẾP
exports.sendToKitchen = async (req, res) => {
  const order_id = req.params.id;
  try {
    await db.query(
      `UPDATE order_items SET status="dang_nau" 
       WHERE order_id=? AND status="cho"`,
      [order_id]
    );
    res.json({ message: 'Đã gửi order xuống bếp!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// BẾP CẬP NHẬT TRẠNG THÁI MÓN
exports.updateItemStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await db.query(
      'UPDATE order_items SET status=? WHERE id=?',
      [status, req.params.itemId]
    );
    res.json({ message: 'Cập nhật trạng thái món thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// SỬA / HỦY MÓN
exports.deleteOrderItem = async (req, res) => {
  try {
    const [item] = await db.query(
      'SELECT * FROM order_items WHERE id=?', [req.params.itemId]
    );
    if (item[0].status !== 'cho') {
      return res.status(400).json({ message: 'Không thể hủy món đang nấu!' });
    }
    await db.query('DELETE FROM order_items WHERE id=?', [req.params.itemId]);
    await updateOrderTotal(req.params.id);
    res.json({ message: 'Hủy món thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// LẤY CHI TIẾT ORDER
exports.getOrderById = async (req, res) => {
  try {
    const [order] = await db.query(
      'SELECT * FROM orders WHERE id=?', [req.params.id]
    );
    if (order.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy order!' });
    }
    const [items] = await db.query(`
      SELECT oi.*, m.name as mon_ten 
      FROM order_items oi
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE oi.order_id=?
    `, [req.params.id]);

    res.json({ ...order[0], items });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// LẤY TẤT CẢ ORDER ĐANG HOẠT ĐỘNG
exports.getActiveOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, t.name as table_name 
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.status = "dang_goi"
      ORDER BY o.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// LẤY ORDER THEO BẾP (món đang nấu)
exports.getKitchenOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT oi.*, m.name as mon_ten, t.name as table_name
      FROM order_items oi
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE oi.status IN ("cho", "dang_nau")
      ORDER BY oi.id ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// HÀM TÍNH TỔNG TIỀN (dùng nội bộ)
async function updateOrderTotal(order_id) {
  await db.query(`
    UPDATE orders SET total_amount = (
      SELECT SUM(price * quantity) 
      FROM order_items 
      WHERE order_id = ? AND status != "huy"
    ) WHERE id = ?
  `, [order_id, order_id]);
}

// LẤY ORDER ĐANG HOẠT ĐỘNG THEO BÀN
exports.getActiveOrderByTable = async (req, res) => {
  const table_id = req.params.tableId;
  try {
    // Tìm order có table_id và trạng thái 'dang_goi' hoặc 'cho_thanh_toan'
    const [order] = await db.query(
      'SELECT * FROM orders WHERE table_id = ? AND status IN ("dang_goi", "cho_thanh_toan") LIMIT 1',
      [table_id]
    );

    if (order.length === 0) {
      return res.status(200).json(null); // Trả về null nếu không có order hoạt động
    }

    // Lấy danh sách món trong order
    const [items] = await db.query(`
      SELECT oi.*, m.name as mon_ten, m.image_url 
      FROM order_items oi
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE oi.order_id = ? AND oi.status != "huy"
    `, [order[0].id]);

    res.json({ ...order[0], items });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// CHỈNH SỬA MÓN (SỐ LƯỢNG / GHI CHÚ) TRONG ORDER
exports.updateOrderItem = async (req, res) => {
  const { quantity, note } = req.body;
  const { id: order_id, itemId } = req.params;
  try {
    const [item] = await db.query(
      'SELECT * FROM order_items WHERE id = ?', [itemId]
    );
    if (item.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn trong order!' });
    }
    if (item[0].status !== 'cho') {
      return res.status(400).json({ message: 'Không thể chỉnh sửa món đang nấu hoặc đã hoàn thành!' });
    }

    if (quantity <= 0) {
      // Xóa món khỏi order nếu số lượng <= 0
      await db.query('DELETE FROM order_items WHERE id = ?', [itemId]);
    } else {
      await db.query(
        'UPDATE order_items SET quantity = ?, note = ? WHERE id = ?',
        [quantity, note !== undefined ? note : item[0].note, itemId]
      );
    }

    // Cập nhật lại tổng tiền order
    await updateOrderTotal(order_id);

    res.json({ message: 'Cập nhật món thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// CHUYỂN BÀN
exports.transferOrder = async (req, res) => {
  const order_id = req.params.id;
  const { target_table_id } = req.body;
  try {
    const [order] = await db.query('SELECT table_id, status FROM orders WHERE id = ?', [order_id]);
    if (order.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy order!' });
    }
    if (order[0].status === 'da_thanh_toan' || order[0].status === 'huy') {
      return res.status(400).json({ message: 'Hóa đơn đã thanh toán hoặc hủy, không thể chuyển bàn!' });
    }

    const source_table_id = order[0].table_id;

    // Kiểm tra xem bàn đích có trống không
    const [targetTable] = await db.query('SELECT status FROM tables WHERE id = ?', [target_table_id]);
    if (targetTable.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bàn đích!' });
    }
    if (targetTable[0].status !== 'trong') {
      return res.status(400).json({ message: 'Bàn đích hiện đang bận hoặc đã đặt!' });
    }

    // Cập nhật bàn đích trong order
    await db.query('UPDATE orders SET table_id = ? WHERE id = ?', [target_table_id, order_id]);

    // Cập nhật trạng thái của hai bàn
    await db.query('UPDATE tables SET status = "trong" WHERE id = ?', [source_table_id]);
    await db.query('UPDATE tables SET status = "dang_dung" WHERE id = ?', [target_table_id]);

    res.json({ message: 'Chuyển bàn thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// GỘP BÀN
exports.mergeOrder = async (req, res) => {
  const source_order_id = req.params.id;
  const { target_table_id } = req.body;
  try {
    // Lấy thông tin order nguồn
    const [sourceOrder] = await db.query('SELECT table_id, status FROM orders WHERE id = ?', [source_order_id]);
    if (sourceOrder.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy order nguồn!' });
    }
    if (sourceOrder[0].status !== 'dang_goi') {
      return res.status(400).json({ message: 'Hóa đơn nguồn không phải ở trạng thái đang gọi!' });
    }

    const source_table_id = sourceOrder[0].table_id;

    // Tìm order hoạt động của bàn đích
    const [targetOrder] = await db.query(
      'SELECT id FROM orders WHERE table_id = ? AND status = "dang_goi" LIMIT 1',
      [target_table_id]
    );
    if (targetOrder.length === 0) {
      return res.status(400).json({ message: 'Bàn đích không có hóa đơn hoạt động nào để gộp!' });
    }

    const target_order_id = targetOrder[0].id;

    // Chuyển toàn bộ món từ order nguồn sang order đích
    const [sourceItems] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [source_order_id]);
    for (const item of sourceItems) {
      if (item.status === 'cho') {
        // Nếu món đang ở trạng thái 'cho', kiểm tra bàn đích có món tương tự chưa
        const [existing] = await db.query(
          'SELECT id, quantity FROM order_items WHERE order_id = ? AND menu_item_id = ? AND status = "cho" LIMIT 1',
          [target_order_id, item.menu_item_id]
        );
        if (existing.length > 0) {
          // Cộng dồn số lượng
          await db.query(
            'UPDATE order_items SET quantity = quantity + ? WHERE id = ?',
            [item.quantity, existing[0].id]
          );
          // Xóa món cũ ở order nguồn
          await db.query('DELETE FROM order_items WHERE id = ?', [item.id]);
        } else {
          // Chuyển order_id
          await db.query('UPDATE order_items SET order_id = ? WHERE id = ?', [target_order_id, item.id]);
        }
      } else {
        // Đối với món đang nấu hoặc hoàn thành, chuyển trực tiếp sang order đích
        await db.query('UPDATE order_items SET order_id = ? WHERE id = ?', [target_order_id, item.id]);
      }
    }

    // Hủy order nguồn
    await db.query('UPDATE orders SET status = "huy", total_amount = 0 WHERE id = ?', [source_order_id]);

    // Trả bàn nguồn về trạng thái trống
    await db.query('UPDATE tables SET status = "trong" WHERE id = ?', [source_table_id]);

    // Tính lại tổng tiền cho bàn đích
    await updateOrderTotal(target_order_id);

    res.json({ message: 'Gộp bàn thành công!', target_order_id });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};