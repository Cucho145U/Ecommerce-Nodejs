"use strict";

var express = require('express');

var router = express.Router();

var ensureAuthenticated = require('../modules/ensureAuthenticated');

var Product = require('../models/Product');

var Variant = require('../models/Variant');

var Department = require('../models/Department');

var Category = require('../models/Category');

var TypedError = require('../modules/ErrorHandler');

var Cart = require('../models/Cart');

var CartClass = require('../modules/Cart');

var paypal_config = require('../configs/paypal-config');

var paypal = require('paypal-rest-sdk');

var mongoose = require('mongoose');

var mongoConfig = require('../configs/mongo-config');

mongoose.connect(mongoConfig, {
  useNewUrlParser: true,
  useCreateIndex: true
}); //GET /products

router.get('/products', function (req, res, next) {
  var _categorizeQueryStrin = categorizeQueryString(req.query),
      query = _categorizeQueryStrin.query,
      order = _categorizeQueryStrin.order;

  Product.getAllProducts(query, order, function (e, products) {
    if (e) {
      e.status = 406;
      return next(e);
    }

    if (products.length < 1) {
      return res.status(404).json({
        message: "products not found"
      });
    }

    res.json({
      products: products
    });
  });
}); //POST /products

router.post('/ingresoproducts', function (req, res, next) {
  var _req$body = req.body,
      imagePath = _req$body.imagePath,
      title = _req$body.title,
      description = _req$body.description,
      price = _req$body.price,
      color = _req$body.color,
      size = _req$body.size,
      array_tags = _req$body.array_tags,
      Pregunta1 = _req$body.Pregunta1,
      Pregunta2 = _req$body.Pregunta2,
      cellphone = _req$body.cellphone;
  req.checkBody('imagePath', 'imagePath is required').notEmpty();
  req.checkBody('title', 'title is required').notEmpty();
  req.checkBody('description', 'description is required').notEmpty();
  req.checkBody('price', 'price is required').notEmpty();
  req.checkBody('color', 'color is required').notEmpty();
  req.checkBody('size', 'size is required').notEmpty();
  req.checkBody('categoria', 'category is required').notEmpty();
  req.checkBody('pregunta1', 'pregunta1 is required').notEmpty();
  req.checkBody('pregunta2', 'pregunta2 is required').notEmpty();
  var date = 5;
  var newProduct = new Product({
    imagePath: imagePath,
    title: title,
    description: description,
    category: array_tags,
    price: price,
    color: color,
    size: size,
    cellphone: cellphone,
    date: date,
    pregunta1: Pregunta1,
    pregunta2: Pregunta2
  });
  /*for (let i = 0; i < array_tags.length; i++) {
      var newCatego = new category({
      categoryName: array_tags[i]
    });
      newCatego.save(function (e, r) {
      if (i === categories.length - 1) {
        exit();
      }
    });
  }*/

  Product.createProduct(newProduct, function (err, user) {
    if (err) return next(err);
    res.json({
      message: 'user created'
    });
  });
}); //GET /products/:id

router.get('/products/:id', function (req, res, next) {
  var productId = req.params.id;
  Product.getProductByID(productId, function (e, item) {
    if (e) {
      e.status = 404;
      return next(e);
    } else {
      res.json({
        product: item
      });
    }
  });
}); //GET /variants

router.get('/variants', function (req, res, next) {
  var productId = req.query.productId;

  if (productId) {
    Variant.getVariantProductByID(productId, function (err, variants) {
      if (err) return next(err);
      return res.json({
        variants: variants
      });
    });
  } else {
    Variant.getAllVariants(function (e, variants) {
      if (e) {
        if (err) return next(err);
      } else {
        return res.json({
          variants: variants
        });
      }
    });
  }
}); //GET /variants/:id

router.get('/variants/:id', ensureAuthenticated, function (req, res, next) {
  var id = req.params.id;

  if (id) {
    Variant.getVariantByID(id, function (err, variants) {
      if (err) return next(err);
      res.json({
        variants: variants
      });
    });
  }
}); //GET /departments

router.get('/departments', function (req, res, next) {
  Department.getAllDepartments(req.query, function (err, d) {
    if (err) return next(err);
    res.status(200).json({
      departments: d
    });
  });
}); //GET /categories

router.get('/categories', function (req, res, next) {
  Category.getAllCategories(function (err, c) {
    if (err) return next(err);
    res.json({
      categories: c
    });
  });
}); //GET /search?

router.get('/search', function (req, res, next) {
  var _categorizeQueryStrin2 = categorizeQueryString(req.query),
      query = _categorizeQueryStrin2.query,
      order = _categorizeQueryStrin2.order;

  query['department'] = query['query'];
  delete query['query'];
  Product.getProductByDepartment(query, order, function (err, p) {
    if (err) return next(err);

    if (p.length > 0) {
      return res.json({
        products: p
      });
    } else {
      query['category'] = query['department'];
      delete query['department'];
      Product.getProductByCategory(query, order, function (err, p) {
        if (err) return next(err);

        if (p.length > 0) {
          return res.json({
            products: p
          });
        } else {
          query['title'] = query['category'];
          delete query['category'];
          Product.getProductByTitle(query, order, function (err, p) {
            if (err) return next(err);

            if (p.length > 0) {
              return res.json({
                products: p
              });
            } else {
              query['id'] = query['title'];
              delete query['title'];
              Product.getProductByID(query.id, function (err, p) {
                var error = new TypedError('search', 404, 'not_found', {
                  message: "no product exist"
                });

                if (err) {
                  return next(error);
                }

                if (p) {
                  return res.json({
                    products: p
                  });
                } else {
                  return next(error);
                }
              });
            }
          });
        }
      });
    }
  });
}); // GET filter

router.get('/filter', function (req, res, next) {
  var result = {};
  var query = req.query.query;
  Product.filterProductByDepartment(query, function (err, p) {
    if (err) return next(err);

    if (p.length > 0) {
      result['department'] = generateFilterResultArray(p, 'department');
    }

    Product.filterProductByCategory(query, function (err, p) {
      if (err) return next(err);

      if (p.length > 0) {
        result['category'] = generateFilterResultArray(p, 'category');
      }

      Product.filterProductByTitle(query, function (err, p) {
        if (err) return next(err);

        if (p.length > 0) {
          result['title'] = generateFilterResultArray(p, 'title');
        }

        if (Object.keys(result).length > 0) {
          return res.json({
            filter: result
          });
        } else {
          var error = new TypedError('search', 404, 'not_found', {
            message: "no product exist"
          });
          return next(error);
        }
      });
    });
  });
}); //GET /checkout

router.get('/checkout/:cartId', ensureAuthenticated, function (req, res, next) {
  var cartId = req.params.cartId; //aea
  //const frontURL = 'https://zack-ecommerce-reactjs.herokuapp.com'
  //const frontURL = 'http://localhost:3000'

  var frontURL = "https://ecommerce-react-unsaac1.herokuapp.com/";
  Cart.getCartById(cartId, function (err, c) {
    if (err) return next(err);

    if (!c) {
      var _err = new TypedError('/checkout', 400, 'invalid_field', {
        message: 'cart not found'
      });

      return next(_err);
    }

    var items_arr = new CartClass(c).generateArray();
    var paypal_list = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = items_arr[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var i = _step.value;
        paypal_list.push({
          "name": i.item.title,
          "price": i.item.price,
          "currency": "CAD",
          "quantity": i.qty
        });
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    var create_payment_json = {
      "intent": "sale",
      "payer": {
        "payment_method": "paypal"
      },
      "redirect_urls": {
        "return_url": frontURL + '/success_page',
        "cancel_url": frontURL + '/cancel_page'
      },
      "transactions": [{
        "item_list": {
          "items": paypal_list
        },
        "amount": {
          "currency": "CAD",
          "total": c.totalPrice
        },
        "description": "This is the payment description."
      }]
    };
    paypal.configure(paypal_config);
    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.log(JSON.stringify(error));
        return next(error);
      } else {
        console.log(payment);
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = payment.links[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var link = _step2.value;

            if (link.rel === 'approval_url') {
              res.json(link.href);
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
    });
  });
}); //GET /payment/success

router.get('/payment/success', ensureAuthenticated, function (req, res, next) {
  var paymentId = req.query.paymentId;
  var payerId = {
    payer_id: req.query.PayerID
  };
  paypal.payment.execute(paymentId, payerId, function (error, payment) {
    if (error) {
      console.error(JSON.stringify(error));
      return next(error);
    } else {
      if (payment.state == 'approved') {
        console.log('payment completed successfully');
        console.log(payment);
        res.json({
          payment: payment
        });
      } else {
        console.log('payment not successful');
      }
    }
  });
});

function generateFilterResultArray(products, targetProp) {
  var result_set = new Set();
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = products[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var p = _step3.value;
      result_set.add(p[targetProp]);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
        _iterator3["return"]();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return Array.from(result_set);
}

function categorizeQueryString(queryObj) {
  var query = {};
  var order = {}; //extract query, order, filter value

  for (var i in queryObj) {
    if (queryObj[i]) {
      // extract order
      if (i === 'order') {
        order['sort'] = queryObj[i];
        continue;
      } // extract range


      if (i === 'range') {
        var range_arr = [];
        var query_arr = []; // multi ranges

        if (queryObj[i].constructor === Array) {
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = queryObj[i][Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var r = _step4.value;
              range_arr = r.split('-');
              query_arr.push({
                price: {
                  $gt: range_arr[0],
                  $lt: range_arr[1]
                }
              });
            }
          } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
                _iterator4["return"]();
              }
            } finally {
              if (_didIteratorError4) {
                throw _iteratorError4;
              }
            }
          }
        } // one range


        if (queryObj[i].constructor === String) {
          range_arr = queryObj[i].split('-');
          query_arr.push({
            price: {
              $gt: range_arr[0],
              $lt: range_arr[1]
            }
          });
        }

        Object.assign(query, {
          $or: query_arr
        });
        delete query[i];
        continue;
      }

      query[i] = queryObj[i];
    }
  }

  return {
    query: query,
    order: order
  };
}

module.exports = router;