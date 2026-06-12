const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Inventory = require('../models/Inventory');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const { getIO } = require('../config/socket');
const {
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
  sendNewOrderNotificationToAdmin,
} = require('../services/emailService');
const logger = require('../utils/logger');

const DELIVERY_FEE = 40;
const TAX_RATE = 0.05;

const deductInventory = async (items, orderId, adminUserId) => {
  for (const item of items) {
    if (item.itemType === 'custom' && item.customDetails) {

      const ingredientNames = [
        item.customDetails.base,
        item.customDetails.sauce,
        item.customDetails.cheese,
        ...(item.customDetails.veggies || []),
        ...(item.customDetails.meats || []),
      ].filter(Boolean);

      for (const name of ingredientNames) {
        const inventoryItem = await Inventory.findOne({ itemName: name });
        if (inventoryItem && inventoryItem.quantity >= item.quantity) {
          inventoryItem.quantity -= item.quantity;
          inventoryItem.logs.push({
            action: 'deduct',
            quantity: item.quantity,
            reason: `Order ${orderId}`,
            orderId,
          });
          await inventoryItem.save();
        }
      }
    }
  }
};

const createOrder = async (req, res, next) => {
  const { deliveryAddress, paymentMethod = 'razorpay', notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty', 400));
  }

  const orderItems = cart.items.map((cartItem) => {
    if (cartItem.itemType === 'pizza') {
      return {
        itemType: 'pizza',
        pizza: cartItem.pizza,
        name: cartItem.pizzaSnapshot.name,
        image: cartItem.pizzaSnapshot.image,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        totalPrice: cartItem.totalPrice,
      };
    } else {
      return {
        itemType: 'custom',
        name: `Custom Pizza (${cartItem.customPizza.baseDetails.name})`,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        totalPrice: cartItem.totalPrice,
        customDetails: {
          base: cartItem.customPizza.baseDetails.name,
          sauce: cartItem.customPizza.sauceDetails.name,
          cheese: cartItem.customPizza.cheeseDetails.name,
          veggies: cartItem.customPizza.veggiesDetails.map((v) => v.name),
          meats: cartItem.customPizza.meatsDetails.map((m) => m.name),
        },
      };
    }
  });

  const subtotal = cart.totalAmount;
  const taxes = Math.round(subtotal * TAX_RATE);
  const totalAmount = subtotal + taxes + DELIVERY_FEE;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    subtotal,
    taxes,
    deliveryFee: DELIVERY_FEE,
    totalAmount,
    deliveryAddress,
    paymentMethod,
    notes,
    statusHistory: [{ status: 'order_received', updatedBy: req.user._id }],
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
  });

  logger.info(`📦 Order created: ${order.orderId} for user: ${req.user.email}`);

  try {
    const io = getIO();
    io.to('admin_room').emit('new_order', {
      orderId: order.orderId,
      _id: order._id,
      totalAmount: order.totalAmount,
      customerName: req.user.name,
      itemCount: order.items.length,
      createdAt: order.createdAt,
    });
  } catch (e) {
    logger.warn('Socket.io emit failed (new_order):', e.message);
  }

  sendOrderConfirmationEmail(req.user, order).catch(logger.error);
  sendNewOrderNotificationToAdmin(
    process.env.ADMIN_EMAIL,
    order,
    req.user
  ).catch(logger.error);

  return ApiResponse.created(res, { order }, 'Order created');
};

const getMyOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const total = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .select('-statusHistory');

  return ApiResponse.paginated(res, { orders }, {
    total, page: Number(page), limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
};

const getOrderById = async (req, res, next) => {
  const query = { _id: req.params.id };

  if (req.user.role !== 'admin') {
    query.user = req.user._id;
  }

  const order = await Order.findOne(query).populate('user', 'name email phone');
  if (!order) return next(new AppError('Order not found', 404));

  return ApiResponse.success(res, { order });
};

const updateOrderStatus = async (req, res, next) => {
  const { status, note } = req.body;

  const validStatuses = ['order_received', 'in_kitchen', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return next(new AppError('Order not found', 404));

  const oldStatus = order.orderStatus;
  order.orderStatus = status;
  order.statusHistory.push({ status, updatedBy: req.user._id, note });

  if (status === 'delivered') {
    order.deliveredAt = new Date();

    deductInventory(order.items, order._id, req.user._id).catch(logger.error);

    sendOrderDeliveredEmail(order.user, order).catch(logger.error);
  }

  await order.save();

  try {
    const io = getIO();
    const statusPayload = {
      orderId: order._id,
      orderCode: order.orderId,
      orderStatus: order.orderStatus,
      updatedAt: new Date(),
      note,
    };

    io.to(`order_${order._id}`).emit('order_status_update', statusPayload);

    io.to(`user_${order.user._id}`).emit('order_status_update', statusPayload);
  } catch (e) {
    logger.warn('Socket.io emit failed (order_status_update):', e.message);
  }

  logger.info(`📦 Order ${order.orderId} status: ${oldStatus} → ${status}`);
  return ApiResponse.success(res, { order }, 'Order status updated');
};

const getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (status) filter.orderStatus = status;
  if (search) filter.orderId = { $regex: search, $options: 'i' };

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('user', 'name email phone')
    .select('-statusHistory');

  return ApiResponse.paginated(res, { orders }, {
    total, page: Number(page), limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
};
