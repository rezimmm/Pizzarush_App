const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getAllPizzas,
  getFeaturedPizzas,
  getPizzaById,
  createPizza,
  updatePizza,
  deletePizza,
} = require('../controllers/pizzaController');

// Public routes
router.get('/', getAllPizzas);
router.get('/featured', getFeaturedPizzas);
router.get('/:id', getPizzaById);

// Admin-only routes
router.use(protect, restrictTo('admin'));
router.post('/', createPizza);
router.put('/:id', updatePizza);
router.delete('/:id', deletePizza);

module.exports = router;
