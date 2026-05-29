const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Đang kết nối cơ sở dữ liệu để khởi tạo danh sách Nguyên liệu, Món ăn và Công thức...');

  try {
    // 1. Tạo các danh mục món ăn mẫu (Món chính, Món phụ)
    const dmList = ['Món chính', 'Món phụ'];
    const categoryIds = {};
    for (const dm of dmList) {
      const [existing] = await connection.query('SELECT id FROM categories WHERE name = ?', [dm]);
      if (existing.length > 0) {
        categoryIds[dm] = existing[0].id;
        console.log(`Danh mục "${dm}" đã tồn tại (ID: ${existing[0].id})`);
      } else {
        const [result] = await connection.query('INSERT INTO categories (name) VALUES (?)', [dm]);
        categoryIds[dm] = result.insertId;
        console.log(`Đã tạo danh mục "${dm}" thành công (ID: ${result.insertId})`);
      }
    }

    // 2. Định nghĩa danh sách Nguyên liệu
    const ingredientSpecs = [
      // Nhóm Thịt & Bò sát
      { name: 'Thịt bò', unit: 'gram', qty: 20000, min: 1000 },
      { name: 'Thịt gà', unit: 'gram', qty: 30000, min: 2000 },
      { name: 'Sụn gà', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Thịt heo', unit: 'gram', qty: 25000, min: 1500 },
      { name: 'Thịt bê', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Dồi dê', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Lươn', unit: 'gram', qty: 8000, min: 500 },
      { name: 'Ếch', unit: 'gram', qty: 12000, min: 800 },

      // Nhóm Hải sản
      { name: 'Tôm đất', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Tôm bạc', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Tôm sú', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Tôm tươi', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Cua gạch', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Cua y', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Mực tươi', unit: 'gram', qty: 20000, min: 1000 },
      { name: 'Mực khô', unit: 'con', qty: 100, min: 10 },
      { name: 'Hàu', unit: 'gram', qty: 30000, min: 2000 },
      { name: 'Hàu tươi', unit: 'gram', qty: 30000, min: 2000 },
      { name: 'Thịt hàu', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Sò điệp', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Sứa', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Xía/Nghêu', unit: 'gram', qty: 20000, min: 1000 },
      { name: 'Cá bớp', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Cá lao', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Cá chỉ vàng', unit: 'gram', qty: 8000, min: 500 },
      { name: 'Cá cơm', unit: 'gram', qty: 8000, min: 500 },
      { name: 'Cá dìa', unit: 'gram', qty: 12000, min: 1000 },
      { name: 'Cá sơn', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Cá ly', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Cá đuối', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Thác lác', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Chả cá thác lác', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Cua đồng giã', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Bao tử heo', unit: 'gram', qty: 10000, min: 1000 },
      { name: 'Khô cá mặn', unit: 'gram', qty: 5000, min: 300 },
      { name: 'Ốc/Tôm', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Chả cá', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Da cá chiên giòn', unit: 'gram', qty: 8000, min: 300 },

      // Nhóm Tinh bột
      { name: 'Cơm/Gạo tẻ', unit: 'gram', qty: 50000, min: 5000 },
      { name: 'Cơm', unit: 'tô', qty: 500, min: 20 },
      { name: 'Gạo tẻ', unit: 'gram', qty: 50000, min: 5000 },
      { name: 'Mì/Miến', unit: 'gram', qty: 30000, min: 2000 },
      { name: 'Bắp hạt', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Khoai tây', unit: 'gram', qty: 20000, min: 1000 },
      { name: 'Bánh tráng', unit: 'phần', qty: 200, min: 20 },
      { name: 'Bún/Mì', unit: 'phần', qty: 500, min: 30 },

      // Nhóm Rau củ & Đậu
      { name: 'Rau muống', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Rau mồng tơi', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Rau cải', unit: 'gram', qty: 20000, min: 1000 },
      { name: 'Rau lẩu các loại', unit: 'gram', qty: 30000, min: 2000 },
      { name: 'Rau các loại', unit: 'gram', qty: 30000, min: 2000 },
      { name: 'Hành tây', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Cà chua', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Dưa leo', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Diếp cá', unit: 'gram', qty: 5000, min: 500 },
      { name: 'Khổ qua', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Lá giang', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Lá lốt', unit: 'gram', qty: 5000, min: 500 },
      { name: 'Măng', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Măng tươi/khô', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Nấm kim châm', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Đậu hũ', unit: 'miếng', qty: 200, min: 20 },
      { name: 'Đậu hũ non', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Đậu phộng', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Rau củ trộn gỏi', unit: 'gram', qty: 20000, min: 1000 },
      { name: 'Rau thơm ăn kèm', unit: 'gram', qty: 5000, min: 500 },
      { name: 'Khoai các loại', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Tiêu xanh', unit: 'gram', qty: 5000, min: 300 },
      { name: 'Các loại củ', unit: 'gram', qty: 15000, min: 1000 },

      // Nhóm Gia vị & Khác
      { name: 'Hành lá', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Tỏi', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Sả', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Ớt', unit: 'gram', qty: 5000, min: 300 },
      { name: 'Gừng', unit: 'gram', qty: 5000, min: 300 },
      { name: 'Chanh', unit: 'gram', qty: 5000, min: 300 },
      { name: 'Trứng', unit: 'quả', qty: 500, min: 50 },
      { name: 'Trứng gà', unit: 'quả', qty: 500, min: 50 },
      { name: 'Bột chiên', unit: 'gram', qty: 15000, min: 1000 },
      { name: 'Mỡ hành', unit: 'phần', qty: 200, min: 20 },
      { name: 'Phô mai', unit: 'phần', qty: 200, min: 20 },
      { name: 'Mù tạt', unit: 'phần', qty: 100, min: 10 },
      { name: 'Me', unit: 'gram', qty: 5000, min: 300 },
      { name: 'Nước dừa/Cà ri', unit: 'phần', qty: 100, min: 10 },
      { name: 'Sa tế', unit: 'phần', qty: 100, min: 10 },
      { name: 'Nước mắm', unit: 'phần', qty: 500, min: 50 },
      { name: 'Đường', unit: 'gram', qty: 20000, min: 1000 },
      { name: 'Muối', unit: 'gram', qty: 20000, min: 1000 },
      { name: 'Dầu ăn', unit: 'phần', qty: 500, min: 50 },
      { name: 'Gia vị xào', unit: 'phần', qty: 500, min: 50 },
      { name: 'Gia vị chay', unit: 'phần', qty: 500, min: 50 },
      { name: 'Gia vị', unit: 'phần', qty: 1000, min: 100 },
      { name: 'Hành ngò', unit: 'gram', qty: 5000, min: 300 },
      { name: 'Chả/Lạp xưởng', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Cà rốt/Đậu', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Muối ớt', unit: 'gram', qty: 5000, min: 300 },
      { name: 'Nước mắm chua ngọt', unit: 'phần', qty: 500, min: 50 },
      { name: 'Nước mắm trộn', unit: 'phần', qty: 500, min: 50 },
      { name: 'Gia vị trộn', unit: 'phần', qty: 500, min: 50 },
      { name: 'Dầu ăn chiên', unit: 'phần', qty: 500, min: 50 },
      { name: 'Gia vị chế biến', unit: 'phần', qty: 500, min: 50 },
      { name: 'Bơ/Dầu ăn', unit: 'gram', qty: 5000, min: 300 },
      { name: 'Hành/Tôm khô', unit: 'gram', qty: 10000, min: 500 },
      { name: 'Gà nguyên con', unit: 'con', qty: 50, min: 5 },
      { name: 'Bột cà ri & Nước cốt dừa', unit: 'phần', qty: 100, min: 10 },
      { name: 'Gà chọi nguyên con', unit: 'con', qty: 20, min: 2 },
      { name: 'Cam/Chanh/Diếp cá', unit: 'gram', qty: 5000, min: 500 },
      { name: 'Gia vị ướp nướng', unit: 'phần', qty: 500, min: 50 },
      { name: 'Gia vị chua ngọt/ướp nướng', unit: 'phần', qty: 500, min: 50 },
      { name: 'Gia vị hầm', unit: 'phần', qty: 500, min: 50 },
      { name: 'Gia vị hấp/rang me/lẩu', unit: 'phần', qty: 100, min: 10 },
      { name: 'Sả ớt & Gia vị um', unit: 'phần', qty: 100, min: 10 },
      { name: 'Bột chiên/Mắm/Sả ớt', unit: 'phần', qty: 100, min: 10 },
      { name: 'Nước lẩu', unit: 'nồi', qty: 500, min: 20 },
      { name: 'Nước hầm xương', unit: 'nồi', qty: 500, min: 20 },
      { name: 'Tương ớt ăn kèm', unit: 'phần', qty: 500, min: 20 },
    ];

    const ingredientIds = {};
    for (const spec of ingredientSpecs) {
      const [existing] = await connection.query('SELECT id FROM ingredients WHERE name = ?', [spec.name]);
      if (existing.length > 0) {
        ingredientIds[spec.name] = existing[0].id;
        // Cập nhật số lượng ban đầu để các món luôn có sẵn
        await connection.query('UPDATE ingredients SET quantity = ?, min_quantity = ? WHERE id = ?', [
          spec.qty,
          spec.min,
          existing[0].id,
        ]);
        console.log(`Nguyên liệu "${spec.name}" đã tồn tại -> Cập nhật tồn kho (ID: ${existing[0].id})`);
      } else {
        const [result] = await connection.query(
          'INSERT INTO ingredients (name, unit, quantity, min_quantity) VALUES (?, ?, ?, ?)',
          [spec.name, spec.unit, spec.qty, spec.min]
        );
        ingredientIds[spec.name] = result.insertId;
        console.log(`Đã tạo nguyên liệu "${spec.name}" thành công (ID: ${result.insertId})`);
      }
    }

    // 3. Định nghĩa các Món ăn & định lượng Recipe tương ứng
    const menuSpecs = [
      // 1. Các món Mì - Miến - Cháo - Cơm (Món chính)
      {
        name: 'Mì (Miếng) xào bò',
        category: 'Món chính',
        price: 80000,
        description: 'Mì xào bò tươi, dai ngon chuẩn vị',
        recipes: [
          { ing: 'Mì/Miến', amount: 150 },
          { ing: 'Thịt bò', amount: 100 },
          { ing: 'Rau cải', amount: 50 },
          { ing: 'Gia vị xào', amount: 1 },
        ],
      },
      {
        name: 'Mì (Miếng) xào hải sản',
        category: 'Món chính',
        price: 110000,
        description: 'Mì xào cùng mực tươi và tôm sú ngọt nước',
        recipes: [
          { ing: 'Mì/Miến', amount: 150 },
          { ing: 'Mực tươi', amount: 50 },
          { ing: 'Tôm tươi', amount: 50 },
          { ing: 'Rau cải', amount: 50 },
          { ing: 'Gia vị xào', amount: 1 },
        ],
      },
      {
        name: 'Mì (Miếng) xào chay',
        category: 'Món chính',
        price: 70000,
        description: 'Lựa chọn chay thanh đạm với nấm đùi gà và đậu phụ non',
        recipes: [
          { ing: 'Mì/Miến', amount: 150 },
          { ing: 'Nấm kim châm', amount: 50 },
          { ing: 'Đậu hũ non', amount: 50 },
          { ing: 'Rau cải', amount: 50 },
          { ing: 'Gia vị chay', amount: 1 },
        ],
      },
      {
        name: 'Cháo hải sản',
        category: 'Món chính',
        price: 120000,
        description: 'Cháo ấm nóng cùng tôm mực tươi ngon',
        recipes: [
          { ing: 'Gạo tẻ', amount: 100 },
          { ing: 'Mực tươi', amount: 50 },
          { ing: 'Tôm tươi', amount: 50 },
          { ing: 'Hành ngò', amount: 10 },
          { ing: 'Gia vị', amount: 1 },
        ],
      },
      {
        name: 'Cháo cá bớp',
        category: 'Món chính',
        price: 120000,
        description: 'Cháo thơm bùi từ phi lê cá bớp tươi ngọt',
        recipes: [
          { ing: 'Gạo tẻ', amount: 100 },
          { ing: 'Cá bớp', amount: 100 },
          { ing: 'Hành ngò', amount: 10 },
          { ing: 'Gia vị', amount: 1 },
        ],
      },
      {
        name: 'Cháo hàu',
        category: 'Món chính',
        price: 90000,
        description: 'Cháo dinh dưỡng từ những con hàu sữa thơm béo',
        recipes: [
          { ing: 'Gạo tẻ', amount: 100 },
          { ing: 'Thịt hàu', amount: 100 },
          { ing: 'Hành ngò', amount: 10 },
          { ing: 'Gia vị', amount: 1 },
        ],
      },
      {
        name: 'Cháo tôm',
        category: 'Món chính',
        price: 80000,
        description: 'Cháo bổ dưỡng thơm ngọt từ tôm sú',
        recipes: [
          { ing: 'Gạo tẻ', amount: 100 },
          { ing: 'Tôm tươi', amount: 100 },
          { ing: 'Hành ngò', amount: 10 },
          { ing: 'Gia vị', amount: 1 },
        ],
      },
      {
        name: 'Cháo bò bằm',
        category: 'Món chính',
        price: 80000,
        description: 'Cháo bò bằm mềm thơm ấm bụng thích hợp mọi lứa tuổi',
        recipes: [
          { ing: 'Gạo tẻ', amount: 100 },
          { ing: 'Thịt bò', amount: 100 },
          { ing: 'Hành ngò', amount: 10 },
          { ing: 'Gia vị', amount: 1 },
        ],
      },
      {
        name: 'Cơm chiên dương châu',
        category: 'Món chính',
        price: 80000,
        description: 'Cơm chiên vàng rượm, sắc màu bắt mắt từ rau củ và trứng',
        recipes: [
          { ing: 'Cơm', amount: 1 },
          { ing: 'Trứng', amount: 1 },
          { ing: 'Chả/Lạp xưởng', amount: 50 },
          { ing: 'Cà rốt/Đậu', amount: 30 },
        ],
      },
      {
        name: 'Cơm chiên cá mặn',
        category: 'Món chính',
        price: 70000,
        description: 'Cơm chiên giòn bùi kết hợp vị đậm đà từ khô cá mặn',
        recipes: [
          { ing: 'Cơm', amount: 1 },
          { ing: 'Khô cá mặn', amount: 30 },
          { ing: 'Trứng', amount: 1 },
          { ing: 'Hành lá', amount: 10 },
        ],
      },
      {
        name: 'Cơm chiên hải sản',
        category: 'Món chính',
        price: 110000,
        description: 'Cơm chiên cùng hải sản tươi cao cấp giòn rụm',
        recipes: [
          { ing: 'Cơm', amount: 1 },
          { ing: 'Mực tươi', amount: 40 },
          { ing: 'Tôm tươi', amount: 40 },
          { ing: 'Trứng', amount: 1 },
          { ing: 'Hành lá', amount: 10 },
        ],
      },
      {
        name: 'Cơm chiên trứng',
        category: 'Món chính',
        price: 50000,
        description: 'Món ăn giản dị mang hương vị truyền thống thơm ngon',
        recipes: [
          { ing: 'Cơm', amount: 1 },
          { ing: 'Trứng', amount: 2 },
          { ing: 'Hành lá', amount: 10 },
        ],
      },
      {
        name: 'Cơm chiên muối ớt',
        category: 'Món chính',
        price: 50000,
        description: 'Cơm chiên cay cay, thơm nồng muối ớt xanh đỏ',
        recipes: [
          { ing: 'Cơm', amount: 1 },
          { ing: 'Muối ớt', amount: 10 },
          { ing: 'Hành lá', amount: 10 },
        ],
      },

      // 2. Các món Rau - Gỏi - Khai vị (Món phụ)
      {
        name: 'Rau xào tỏi (Muống/Mồng tơi/Cải)',
        category: 'Món phụ',
        price: 45000,
        description: 'Rau tươi xanh giòn ngọt phi thơm cùng tỏi',
        recipes: [
          { ing: 'Rau các loại', amount: 200 },
          { ing: 'Tỏi', amount: 10 },
          { ing: 'Dầu ăn', amount: 1 },
        ],
      },
      {
        name: 'Canh rau (Hàu/Tôm/Rong biển)',
        category: 'Món phụ',
        price: 90000,
        description: 'Canh nóng ngọt mát tự nhiên từ hải sản tươi',
        recipes: [
          { ing: 'Rau các loại', amount: 100 },
          { ing: 'Tôm tươi', amount: 50 },
          { ing: 'Gia vị', amount: 1 },
        ],
      },
      {
        name: 'Gỏi bò / Gỏi bò bóp',
        category: 'Món phụ',
        price: 110000,
        description: 'Thịt bò tái chanh/cam chua ngọt hài hòa trộn gỏi giòn tan',
        recipes: [
          { ing: 'Thịt bò', amount: 100 },
          { ing: 'Rau củ trộn gỏi', amount: 150 },
          { ing: 'Đậu phộng', amount: 10 },
          { ing: 'Nước mắm chua ngọt', amount: 1 },
        ],
      },
      {
        name: 'Gỏi hải sản / Gỏi thập cẩm',
        category: 'Món phụ',
        price: 115000,
        description: 'Gỏi trộn chua ngọt cùng tôm và mực tươi ngon giòn rụm',
        recipes: [
          { ing: 'Mực tươi', amount: 50 },
          { ing: 'Tôm tươi', amount: 50 },
          { ing: 'Rau củ trộn gỏi', amount: 150 },
          { ing: 'Nước mắm trộn', amount: 1 },
        ],
      },
      {
        name: 'Gỏi sứa',
        category: 'Món phụ',
        price: 95000,
        description: 'Sứa biển giòn sần sật bóp gỏi trộn cùng chanh ớt',
        recipes: [
          { ing: 'Sứa', amount: 150 },
          { ing: 'Rau củ trộn gỏi', amount: 100 },
          { ing: 'Nước mắm trộn', amount: 1 },
        ],
      },
      {
        name: 'Gỏi ốc / Gỏi tôm',
        category: 'Món phụ',
        price: 95000,
        description: 'Món ăn kèm chua cay siêu bắt miệng',
        recipes: [
          { ing: 'Ốc/Tôm', amount: 100 },
          { ing: 'Rau củ trộn gỏi', amount: 150 },
          { ing: 'Gia vị trộn', amount: 1 },
        ],
      },
      {
        name: 'Chả ram tôm đất',
        category: 'Món phụ',
        price: 60000,
        description: 'Món chả ram Bình Định nổi tiếng giòn thơm, ngọt tôm đất nguyên con',
        recipes: [
          { ing: 'Tôm đất', amount: 100 },
          { ing: 'Bánh tráng', amount: 1 },
          { ing: 'Dầu ăn chiên', amount: 1 },
        ],
      },
      {
        name: 'Đậu non chiên xù / Lướt ván / Chiên giòn',
        category: 'Món phụ',
        price: 55000,
        description: 'Đậu hũ non bên trong béo ngậy mềm mịn, bên ngoài giòn rụm',
        recipes: [
          { ing: 'Đậu hũ non', amount: 150 },
          { ing: 'Bột chiên', amount: 50 },
          { ing: 'Dầu ăn chiên', amount: 1 },
        ],
      },
      {
        name: 'Dồi dê nướng',
        category: 'Món phụ',
        price: 90000,
        description: 'Dồi dê nướng thơm phức bùi ngậy ăn kèm các loại rau thơm rừng',
        recipes: [
          { ing: 'Dồi dê', amount: 150 },
          { ing: 'Rau thơm ăn kèm', amount: 20 },
        ],
      },
      {
        name: 'Khoai tây chiên',
        category: 'Món phụ',
        price: 60000,
        description: 'Khoai tây cắt lát chiên giòn chấm cùng tương cà, tương ớt',
        recipes: [
          { ing: 'Khoai tây', amount: 200 },
          { ing: 'Dầu ăn chiên', amount: 1 },
        ],
      },
      {
        name: 'Hàu chiên trứng',
        category: 'Món phụ',
        price: 90000,
        description: 'Món khai vị bổ dưỡng kết hợp hàu sữa béo và trứng gà',
        recipes: [
          { ing: 'Thịt hàu', amount: 100 },
          { ing: 'Trứng gà', amount: 2 },
          { ing: 'Hành lá', amount: 10 },
        ],
      },
      {
        name: 'Da cá trộn',
        category: 'Món phụ',
        price: 80000,
        description: 'Da cá giòn tan quyện nước mắm trộn chua ngọt',
        recipes: [
          { ing: 'Da cá chiên giòn', amount: 100 },
          { ing: 'Gia vị trộn', amount: 1 },
        ],
      },
      {
        name: 'Bắp xào hành / Bắp xào tôm',
        category: 'Món phụ',
        price: 60000,
        description: 'Bắp ngọt giòn thơm lừng bơ xào cùng hành và tôm khô ngọt',
        recipes: [
          { ing: 'Bắp hạt', amount: 150 },
          { ing: 'Hành/Tôm khô', amount: 35 },
          { ing: 'Bơ/Dầu ăn', amount: 10 },
        ],
      },
      {
        name: 'Chả cá chiên',
        category: 'Món phụ',
        price: 90000,
        description: 'Chả cá chiên nóng hổi dai dai chấm tương ớt cay nồng',
        recipes: [
          { ing: 'Chả cá', amount: 150 },
          { ing: 'Dầu ăn chiên', amount: 1 },
        ],
      },

      // 3. Các món Gà - Bò - Heo - Bê (Món chính)
      {
        name: 'Gà (Hấp hành/ Muối nổ/ Lá giang/ Kho sả...)',
        category: 'Món chính',
        price: 360000,
        description: 'Gà thả vườn nguyên con thịt dai ngọt, chế biến theo khẩu vị tùy chọn',
        recipes: [
          { ing: 'Gà nguyên con', amount: 1 },
          { ing: 'Gia vị chế biến', amount: 1 },
        ],
      },
      {
        name: 'Gà 3 món',
        category: 'Món chính',
        price: 390000,
        description: 'Gà thả vườn nguyên con, chế biến làm 3 món đặc sản hấp dẫn',
        recipes: [
          { ing: 'Gà nguyên con', amount: 1 },
          { ing: 'Gia vị chế biến', amount: 1 },
        ],
      },
      {
        name: 'Gà nấu cà ry',
        category: 'Món chính',
        price: 460000,
        description: 'Gà tơ nấu cà ri ngậy béo nước cốt dừa kèm khoai bùi bùi',
        recipes: [
          { ing: 'Gà nguyên con', amount: 1 },
          { ing: 'Bột cà ri & Nước cốt dừa', amount: 1 },
          { ing: 'Khoai các loại', amount: 200 },
        ],
      },
      {
        name: 'Gà chọi (Đặt trước)',
        category: 'Món chính',
        price: 750000,
        description: 'Gà chọi nguyên con săn chắc thơm ngọt, đặt trước để chế biến đặc sản',
        recipes: [
          { ing: 'Gà chọi nguyên con', amount: 1 },
          { ing: 'Gia vị chế biến', amount: 1 },
        ],
      },
      {
        name: 'Bò tái cam / Tái chanh / Nướng / Lúc lắc...',
        category: 'Món chính',
        price: 130000,
        description: 'Thịt bò tơ phi lê mềm mọng, chế biến đa dạng nướng thơm ngon',
        recipes: [
          { ing: 'Thịt bò', amount: 175 },
          { ing: 'Cam/Chanh/Diếp cá', amount: 50 },
        ],
      },
      {
        name: 'Bò cuộn nấm kim châm / Bò nướng lá lốt',
        category: 'Món chính',
        price: 120000,
        description: 'Thịt bò tơ mềm cuộn nấm kim châm thanh ngọt hoặc lá lốt thơm lừng',
        recipes: [
          { ing: 'Thịt bò', amount: 150 },
          { ing: 'Nấm kim châm', amount: 50 },
        ],
      },
      {
        name: 'Bê hấp / Xào lăn / Tái chanh / Nướng...',
        category: 'Món chính',
        price: 130000,
        description: 'Thịt bê non da giòn thịt ngọt chế biến đa dạng hấp dẫn',
        recipes: [
          { ing: 'Thịt bê', amount: 200 },
          { ing: 'Gia vị chế biến', amount: 1 },
        ],
      },
      {
        name: 'Ba chỉ nướng',
        category: 'Món chính',
        price: 100000,
        description: 'Thịt ba chỉ heo giòn bì, ướp nướng muối ớt đậm đà thơm lừng',
        recipes: [
          { ing: 'Thịt heo', amount: 200 },
          { ing: 'Gia vị ướp nướng', amount: 1 },
        ],
      },
      {
        name: 'Sườn non xào chua ngọt / Sườn non nướng',
        category: 'Món chính',
        price: 120000,
        description: 'Sườn non heo nhiều thịt đậm đà chua ngọt hoặc nướng giòn tan',
        recipes: [
          { ing: 'Thịt heo', amount: 250 },
          { ing: 'Gia vị chua ngọt/ướp nướng', amount: 1 },
        ],
      },
      {
        name: 'Móng heo chiên / Đuôi heo chiên',
        category: 'Món chính',
        price: 95000,
        description: 'Móng heo/Đuôi heo chiên giòn tan ngoài da, bên trong mềm mọng',
        recipes: [
          { ing: 'Thịt heo', amount: 275 },
          { ing: 'Dầu ăn chiên', amount: 1 },
        ],
      },
      {
        name: 'Đuôi heo hầm măng',
        category: 'Món chính',
        price: 130000,
        description: 'Đuôi heo hầm nhừ thơm ngọt cùng măng tươi giòn',
        recipes: [
          { ing: 'Thịt heo', amount: 200 },
          { ing: 'Măng tươi/khô', amount: 100 },
          { ing: 'Gia vị hầm', amount: 1 },
        ],
      },

      // 4. Các món Hải sản: Cua - Tôm - Mực - Cá - Sò - Ếch - Lươn (Món chính)
      {
        name: 'Cua (Hấp / Rang me) & Lẩu cua',
        category: 'Món chính',
        price: 390000,
        description: 'Cua gạch/Cua y tươi sống thịt chắc ngọt, chế biến theo thời giá',
        recipes: [
          { ing: 'Cua gạch', amount: 1000 },
          { ing: 'Gia vị hấp/rang me/lẩu', amount: 1 },
        ],
      },
      {
        name: 'Tôm (Rang me/ Rang muối/ Hấp/ Nướng...)',
        category: 'Món chính',
        price: 250000,
        description: 'Tôm sú tươi giòn, nướng mọi hoặc sốt thái chua cay siêu ngon',
        recipes: [
          { ing: 'Tôm tươi', amount: 500 },
          { ing: 'Gia vị chế biến', amount: 1 },
        ],
      },
      {
        name: 'Mực (Hấp gừng/ Nướng/ Xào chua ngọt...)',
        category: 'Món chính',
        price: 180000,
        description: 'Mực tươi dày thịt giòn ngọt, hấp hành gừng hoặc nướng muối ớt cay nồng',
        recipes: [
          { ing: 'Mực tươi', amount: 300 },
          { ing: 'Gia vị chế biến', amount: 1 },
        ],
      },
      {
        name: 'Cá (Đuối, Dìa, Sơn, Chỉ vàng, Cơm, Lao...)',
        category: 'Món chính',
        price: 150000,
        description: 'Cá biển tươi đánh bắt trong ngày, chế biến nướng mọi, hấp cuốn bánh tráng',
        recipes: [
          { ing: 'Cá dìa', amount: 500 },
          { ing: 'Gia vị chế biến', amount: 1 },
        ],
      },
      {
        name: 'Cá lao chiên mắm',
        category: 'Món chính',
        price: 100000,
        description: 'Cá lao chiên vàng rụm rưới sốt mắm tỏi ớt đặc kẹo đậm đà',
        recipes: [
          { ing: 'Cá lao', amount: 200 },
          { ing: 'Nước mắm', amount: 1 },
        ],
      },
      {
        name: 'Lươn um / Lươn xào sả ớt',
        category: 'Món chính',
        price: 115000,
        description: 'Lươn đồng béo ngậy um sả ớt nước cốt dừa nồng nàn hấp dẫn',
        recipes: [
          { ing: 'Lươn', amount: 200 },
          { ing: 'Sả ớt & Gia vị um', amount: 1 },
        ],
      },
      {
        name: 'Ếch chiên xù / Chiên bột / Chiên mắm...',
        category: 'Món chính',
        price: 110000,
        description: 'Ếch đồng béo múp, xào sả ớt nồng nàn đưa cơm, nhắm bia cực thích',
        recipes: [
          { ing: 'Ếch', amount: 250 },
          { ing: 'Bột chiên/Mắm/Sả ớt', amount: 1 },
        ],
      },
      {
        name: 'Sò điệp nướng mỡ hành',
        category: 'Món chính',
        price: 100000,
        description: 'Sò điệp nướng thơm mỡ hành, rắc đậu phộng thơm ngậy giòn sần sật',
        recipes: [
          { ing: 'Sò điệp', amount: 200 },
          { ing: 'Mỡ hành', amount: 1 },
        ],
      },
      {
        name: 'Mực khô nướng',
        category: 'Món phụ',
        price: 100000,
        description: 'Mực khô loại 1 dày thịt nướng cồn thơm lừng nhắm bia',
        recipes: [
          { ing: 'Mực khô', amount: 1 },
          { ing: 'Tương ớt ăn kèm', amount: 1 },
        ],
      },
      {
        name: 'Hàu nướng phô mai / nướng mỡ hành',
        category: 'Món chính',
        price: 160000,
        description: 'Hàu sữa tươi nướng phô mai đút lò ngập ngụa béo ngậy',
        recipes: [
          { ing: 'Hàu tươi', amount: 1000 },
          { ing: 'Phô mai', amount: 1 },
        ],
      },
      {
        name: 'Xía hấp',
        category: 'Món chính',
        price: 100000,
        description: 'Xía/Nghêu hấp sả dứa thanh ngọt ấm lòng ngày mưa',
        recipes: [
          { ing: 'Xía/Nghêu', amount: 300 },
          { ing: 'Sả', amount: 20 },
          { ing: 'Gia vị', amount: 1 },
        ],
      },

      // 5. Các món Lẩu (Món chính)
      {
        name: 'Lẩu hải sản / Lẩu thập cẩm / Lẩu thái',
        category: 'Món chính',
        price: 265000,
        description: 'Nồi lẩu chua cay nghi ngút khói cùng tôm mực bò xách phong phú cực nhiều topping',
        recipes: [
          { ing: 'Nước lẩu', amount: 1 },
          { ing: 'Mực tươi', amount: 150 },
          { ing: 'Tôm tươi', amount: 150 },
          { ing: 'Rau lẩu các loại', amount: 200 },
          { ing: 'Bún/Mì', amount: 2 },
        ],
      },
      {
        name: 'Lẩu thác lác lá giang / lẩu thác lác khổ qua',
        category: 'Món chính',
        price: 180000,
        description: 'Lẩu chả cá thác lác dai sần sật kết hợp vị chua ngọt thanh mát lá giang hoặc khổ qua',
        recipes: [
          { ing: 'Nước lẩu', amount: 1 },
          { ing: 'Chả cá thác lác', amount: 200 },
          { ing: 'Lá giang', amount: 150 },
          { ing: 'Bún/Mì', amount: 2 },
        ],
      },
      {
        name: 'Lẩu cá bớp',
        category: 'Món chính',
        price: 300000,
        description: 'Lẩu cá bớp măng chua đặc sắc, cá tươi cắt khoanh dày thịt ngọt béo',
        recipes: [
          { ing: 'Nước lẩu', amount: 1 },
          { ing: 'Cá bớp', amount: 300 },
          { ing: 'Rau lẩu các loại', amount: 200 },
          { ing: 'Bún/Mì', amount: 2 },
        ],
      },
      {
        name: 'Lẩu riêu cua bò / riêu cua đồng / riêu cua...',
        category: 'Món chính',
        price: 180000,
        description: 'Lẩu riêu cua đồng đặc sánh vàng óng béo ngậy kèm bắp bò tơ mềm ngon',
        recipes: [
          { ing: 'Nước lẩu', amount: 1 },
          { ing: 'Thịt bò', amount: 200 },
          { ing: 'Cua đồng giã', amount: 100 },
          { ing: 'Rau lẩu các loại', amount: 200 },
        ],
      },
      {
        name: 'Lẩu bao tử hầm tiêu',
        category: 'Món chính',
        price: 130000,
        description: 'Lẩu bao tử heo giòn sần sật, nước lẩu hầm tiêu xanh cay ấm tốt cho sức khỏe',
        recipes: [
          { ing: 'Nước lẩu', amount: 1 },
          { ing: 'Bao tử heo', amount: 200 },
          { ing: 'Tiêu xanh', amount: 50 },
          { ing: 'Rau các loại', amount: 100 },
        ],
      },
      {
        name: 'Lẩu đuôi móng heo hầm củ',
        category: 'Món chính',
        price: 250000,
        description: 'Nước hầm xương ngọt thanh mát tự nhiên nấu cùng đuôi và móng heo nhừ béo ngậy',
        recipes: [
          { ing: 'Nước hầm xương', amount: 1 },
          { ing: 'Thịt heo', amount: 300 },
          { ing: 'Các loại củ', amount: 150 },
        ],
      },
    ];

    for (const spec of menuSpecs) {
      const categoryId = categoryIds[spec.category];
      const [existing] = await connection.query('SELECT id FROM menu_items WHERE name = ?', [spec.name]);
      let menuItemId;

      if (existing.length > 0) {
        menuItemId = existing[0].id;
        await connection.query(
          'UPDATE menu_items SET price = ?, description = ?, category_id = ?, is_visible = 1 WHERE id = ?',
          [spec.price, spec.description, categoryId, menuItemId]
        );
        console.log(`Món ăn "${spec.name}" đã tồn tại -> Cập nhật thông tin (ID: ${menuItemId})`);
      } else {
        const [result] = await connection.query(
          'INSERT INTO menu_items (name, price, description, category_id, is_visible) VALUES (?, ?, ?, ?, 1)',
          [spec.name, spec.price, spec.description, categoryId]
        );
        menuItemId = result.insertId;
        console.log(`Đã tạo món ăn "${spec.name}" thành công (ID: ${menuItemId})`);
      }

      // Xóa công thức cũ của món này để seed lại chính xác nhất
      await connection.query('DELETE FROM recipes WHERE menu_item_id = ?', [menuItemId]);

      // Thêm định lượng Recipe
      for (const recipeSpec of spec.recipes) {
        const ingredientId = ingredientIds[recipeSpec.ing];
        if (ingredientId) {
          await connection.query(
            'INSERT INTO recipes (menu_item_id, ingredient_id, amount) VALUES (?, ?, ?)',
            [menuItemId, ingredientId, recipeSpec.amount]
          );
        } else {
          console.warn(`[CẢNH BÁO] Không tìm thấy nguyên liệu "${recipeSpec.ing}" cho món "${spec.name}"`);
        }
      }
      console.log(`-> Đã gán công thức định lượng thành công cho món "${spec.name}"`);
    }

    console.log('\n--- Hoàn tất khởi tạo toàn bộ Thực đơn, Nguyên liệu & Công thức mẫu! ---');
  } catch (err) {
    console.error('Lỗi trong quá trình khởi tạo dữ liệu thực đơn và nguyên liệu:', err);
  } finally {
    await connection.end();
  }
}

seed();
