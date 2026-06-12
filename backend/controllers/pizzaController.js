const Pizza = require('../models/Pizza');
const { ApiResponse, AppError } = require('../utils/apiResponse');

const getAllPizzas = async (req, res) => {
  const { search, category, sort, available, page = 1, limit = 12 } = req.query;

  const filter = {};

  if (search) {
    filter.$text = { $search: search };
  }

  if (category && ['veg', 'non-veg', 'vegan'].includes(category)) {
    filter.category = category;
  }

  if (available === 'true') {
    filter.isAvailable = true;
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  else if (sort === 'price_desc') sortOption = { price: -1 };
  else if (sort === 'name_asc') sortOption = { name: 1 };
  else if (sort === 'popular') sortOption = { 'ratings.average': -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Pizza.countDocuments(filter);
  const pizzas = await Pizza.find(filter).sort(sortOption).skip(skip).limit(Number(limit));

  return ApiResponse.paginated(
    res,
    { pizzas },
    {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    }
  );
};

const getFeaturedPizzas = async (req, res) => {
  const pizzas = await Pizza.find({ isFeatured: true, isAvailable: true }).limit(6);
  return ApiResponse.success(res, { pizzas });
};

const getPizzaById = async (req, res, next) => {
  const pizza = await Pizza.findById(req.params.id);
  if (!pizza) return next(new AppError('Pizza not found', 404));
  return ApiResponse.success(res, { pizza });
};

const createPizza = async (req, res) => {
  const pizza = await Pizza.create(req.body);
  return ApiResponse.created(res, { pizza }, 'Pizza created');
};

const updatePizza = async (req, res, next) => {
  const pizza = await Pizza.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!pizza) return next(new AppError('Pizza not found', 404));
  return ApiResponse.success(res, { pizza }, 'Pizza updated');
};

const deletePizza = async (req, res, next) => {
  const pizza = await Pizza.findByIdAndDelete(req.params.id);
  if (!pizza) return next(new AppError('Pizza not found', 404));
  return ApiResponse.success(res, {}, 'Pizza deleted');
};

module.exports = {
  getAllPizzas,
  getFeaturedPizzas,
  getPizzaById,
  createPizza,
  updatePizza,
  deletePizza,
};
