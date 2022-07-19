const { builtinModules } = require("module");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: dishes })
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`
    })
  }
}

function priceIsValid(req, res, next) {
  const {data: { price} = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: 'Dish must have a price that is an integer greater than 0'
    });
  }
  next()
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: {nextId},
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  }
  dishes.push(newDish);
  res.status(201).json({ data: newDish})
}

function dishExists(req, res, next) {
  const {dishId} = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    messge: `Dish id not found: ${dishId}`
  })
}

function read(req, res, next) {
  res.json({ data: res.locals.dish })
}

function idMatch(req, res, next) {
  const { data: {id} = {} } = req.body;
  const {dishId} = req.params;
  if(!id || id === dishId) {
    res.locals.dishId = dishId;
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
  })
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.id = dish.id;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish })
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    create
  ],
  list,
  read: [
    dishExists,
    read
  ],
  update: [
    dishExists,
    bodyDataHas('name'),
    bodyDataHas('description'),
    bodyDataHas('price'),
    bodyDataHas('image_url'),
    priceIsValid,
    idMatch,
    update
  ]
}