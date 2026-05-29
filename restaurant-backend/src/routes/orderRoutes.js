const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/active', verifyToken, orderController.getActiveOrders);
router.get('/kitchen', verifyToken, orderController.getKitchenOrders);
router.get('/table/:tableId/active', verifyToken, orderController.getActiveOrderByTable);
router.get('/:id', verifyToken, orderController.getOrderById);
router.post('/', verifyToken, orderController.createOrder);
router.post('/:id/items', verifyToken, orderController.addOrderItem);
router.put('/:id/items/:itemId', verifyToken, orderController.updateOrderItem);
router.post('/:id/send', verifyToken, orderController.sendToKitchen);
router.post('/:id/transfer', verifyToken, orderController.transferOrder);
router.post('/:id/merge', verifyToken, orderController.mergeOrder);
router.patch('/:id/items/:itemId/status', verifyToken, orderController.updateItemStatus);
router.delete('/:id/items/:itemId', verifyToken, orderController.deleteOrderItem);

module.exports = router;