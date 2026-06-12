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

router.get('/', getAllPizzas);
router.get('/featured', getFeaturedPizzas);
router.get('/:id', getPizzaById);

router.use(protect, restrictTo('admin'));
router.post('/', createPizza);
router.put('/:id', updatePizza);
router.delete('/:id', deletePizza);

module.exports = router;
