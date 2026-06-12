const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getAllInventory,
  getAvailableItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  deleteInventoryItem,
} = require('../controllers/inventoryController');

router.get('/available', getAvailableItems);

router.use(protect, restrictTo('admin'));
router.get('/', getAllInventory);
router.get('/:id', getInventoryItem);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.patch('/:id/stock', adjustStock);
router.delete('/:id', deleteInventoryItem);

module.exports = router;
