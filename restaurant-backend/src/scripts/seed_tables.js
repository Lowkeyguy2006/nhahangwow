const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Đang kết nối cơ sở dữ liệu để khởi tạo danh sách Khu vực và Bàn ăn...');

  try {
    // 1. Tạo các Khu vực mẫu
    const khuVuc = ['Khu Chồi', 'Khu VIP', 'Khu Bán Hàng'];
    const areaIds = {};

    for (const name of khuVuc) {
      const [existing] = await connection.query('SELECT id FROM areas WHERE name = ?', [name]);
      if (existing.length > 0) {
        areaIds[name] = existing[0].id;
        console.log(`Khu vực "${name}" đã tồn tại (ID: ${existing[0].id})`);
      } else {
        const [result] = await connection.query('INSERT INTO areas (name) VALUES (?)', [name]);
        areaIds[name] = result.insertId;
        console.log(`Đã tạo khu vực "${name}" thành công (ID: ${result.insertId})`);
      }
    }

    // 2. Tạo các bàn thuộc "Khu Chồi" (Chồi 01 -> Chồi 06)
    const choiTables = ['Chồi 01', 'Chồi 02', 'Chồi 03', 'Chồi 04', 'Chồi 05', 'Chồi 06'];
    for (const tableName of choiTables) {
      const [existing] = await connection.query('SELECT id FROM tables WHERE name = ?', [tableName]);
      if (existing.length === 0) {
        await connection.query('INSERT INTO tables (name, area_id, status) VALUES (?, ?, "trong")', [
          tableName,
          areaIds['Khu Chồi'],
        ]);
        console.log(`Đã tạo bàn "${tableName}" -> Khu Chồi`);
      } else {
        console.log(`Bàn "${tableName}" đã tồn tại.`);
      }
    }

    // 3. Tạo các bàn thuộc "Khu VIP" (VIP 01 -> VIP 04)
    const vipTables = ['VIP 01', 'VIP 02', 'VIP 03', 'VIP 04'];
    for (const tableName of vipTables) {
      const [existing] = await connection.query('SELECT id FROM tables WHERE name = ?', [tableName]);
      if (existing.length === 0) {
        await connection.query('INSERT INTO tables (name, area_id, status) VALUES (?, ?, "trong")', [
          tableName,
          areaIds['Khu VIP'],
        ]);
        console.log(`Đã tạo bàn "${tableName}" -> Khu VIP`);
      } else {
        console.log(`Bàn "${tableName}" đã tồn tại.`);
      }
    }

    // 4. Tạo các bàn thuộc "Khu Bán Hàng" (Bàn 07 -> Bàn 16)
    const normalTables = [
      'Bàn 01', 'Bàn 02', 'Bàn 03', 'Bàn 04', 'Bàn 05', 
      'Bàn 06', 'Bàn 07', 'Bàn 08', 'Bàn 09', 'Bàn 10', 
      'Bàn 11', 'Bàn 12', 'Bàn 13', 'Bàn 14', 'Bàn 15',
    ];
    for (const tableName of normalTables) {
      const [existing] = await connection.query('SELECT id FROM tables WHERE name = ?', [tableName]);
      if (existing.length === 0) {
        await connection.query('INSERT INTO tables (name, area_id, status) VALUES (?, ?, "trong")', [
          tableName,
          areaIds['Khu Bán Hàng'],
        ]);
        console.log(`Đã tạo bàn "${tableName}" -> Khu Bán Hàng`);
      } else {
        console.log(`Bàn "${tableName}" đã tồn tại.`);
      }
    }

    console.log('\n--- Hoàn tất khởi tạo cơ sở dữ liệu sơ đồ bàn ăn! ---');
  } catch (err) {
    console.error('Lỗi trong quá trình khởi tạo dữ liệu bàn:', err);
  } finally {
    await connection.end();
  }
}

seed();
