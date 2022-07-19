const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: orders })
}

function bodyDataHas(propertyName) {
  return function(req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next ({
      status: 400,
      message: `Order must include a ${propertyName}`
    })
  }

}

function dishesIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes.length || !Array.isArray(dishes)) {
    return next({
      status: 400,
      message: `Order must include at least one dish`
    })
  }
  next()
}

function quantityIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (let i = 0; i < dishes.length; i++) {
    if (!dishes[i].quantity || dishes[i].quantity <= 0 || !Number.isInteger(dishes[i].quantity)) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`
      })
    }
  }
  next();
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: {nextId},
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder })
}

function orderExists(req, res, next) {
  const {orderId} = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`
  })
}

function read(req, res, next) {
  res.json({data: res.locals.order})
}

function idMatch(req, res, next) {
  const { data: {id} = {} } = req.body;
  const {orderId} = req.params;
  if (!id || id === orderId) {
    res.locals.orderId = orderId;
    return next()
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
  })
}

function statusIsValid(req, res, next) {
  const { data: {status} = {} } = req.body;
  const validStatus = ['pending', 'preparing', 'out-for-delivery', 'delivered']
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
  })
}

function statusNotDelivered(req, res, next) {
  const status = res.locals.order.status;
  if (status === 'delivered') {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`
    })
  }
  next()
}

function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  order.id = order.id;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.dishes = dishes;

  res.json({data: order})
}

function statusPending(req, res, next) {
  const status = res.locals.order.status;
  if (status !== 'pending') {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    })
  }
  next()
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsValid,
    quantityIsValid,
    create,
  ],
  list,
  read: [
    orderExists,
    read
  ],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsValid,
    quantityIsValid,
    idMatch,
    statusIsValid,
    statusNotDelivered,
    update,
  ],
  delete: [
    orderExists,
    statusPending,
    destroy,
  ]
}