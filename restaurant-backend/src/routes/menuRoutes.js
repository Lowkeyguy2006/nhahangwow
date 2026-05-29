const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyToken, isAdmin, isAdminOrKitchen } = require('../middleware/authMiddleware');

// Public — ai cũng xem được
router.get('/categories', menuController.getCategories);
router.get('/', menuController.getAllItems);
router.get('/:id', menuController.getItemById);

// Admin & Bếp được thêm/sửa/xóa
router.post('/categories', verifyToken, isAdminOrKitchen, menuController.createCategory);
router.put('/categories/:id', verifyToken, isAdminOrKitchen, menuController.updateCategory);
router.delete('/categories/:id', verifyToken, isAdminOrKitchen, menuController.deleteCategory);
router.post('/', verifyToken, isAdminOrKitchen, menuController.createItem);
router.put('/:id', verifyToken, isAdminOrKitchen, menuController.updateItem);
router.delete('/:id', verifyToken, isAdminOrKitchen, menuController.deleteItem);
router.patch('/:id/toggle', verifyToken, isAdminOrKitchen, menuController.toggleVisibility);

module.exports = router;
