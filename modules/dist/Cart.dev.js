"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var cartModel = require('../models/Cart');

var Cart =
/*#__PURE__*/
function () {
  function Cart(oldCart) {
    _classCallCheck(this, Cart);

    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;
    this.userId = oldCart.userId || "";
  }

  _createClass(Cart, [{
    key: "add",
    value: function add(item, id) {
      var storedItem = this.items[id];

      if (!storedItem) {
        storedItem = this.items[id] = {
          item: item,
          qty: 0,
          price: 0
        };
      }

      storedItem.qty++;
      storedItem.price = parseFloat((storedItem.item.price * storedItem.qty).toFixed(2));
      this.items[id] = storedItem;
      this.totalQty++;
      this.totalPrice += storedItem.item.price;
      this.totalPrice = parseFloat(this.totalPrice.toFixed(2));
      return this;
    }
  }, {
    key: "generateModel",
    value: function generateModel() {
      var newCart = new cartModel({
        items: this.items,
        totalQty: this.totalQty,
        totalPrice: this.totalPrice,
        userId: this.userId
      });
      return newCart;
    }
  }, {
    key: "decreaseQty",
    value: function decreaseQty(id) {
      this.items[id].qty--;
      this.items[id].price -= this.items[id].item.price;
      this.items[id].price = parseFloat(this.items[id].price.toFixed(2));
      this.totalQty--;
      this.totalPrice -= this.items[id].item.price;
      this.totalPrice = parseFloat(this.totalPrice.toFixed(2));

      if (this.items[id].qty <= 0) {
        delete this.items[id];
      }

      return this;
    }
  }, {
    key: "increaseQty",
    value: function increaseQty(id) {
      this.items[id].qty++;
      this.items[id].price += this.items[id].item.price;
      this.items[id].price = parseFloat(this.items[id].price.toFixed(2));
      this.totalQty++;
      this.totalPrice += this.items[id].item.price;
      this.totalPrice = parseFloat(this.totalPrice.toFixed(2));
      return this;
    }
  }, {
    key: "generateArray",
    value: function generateArray() {
      var arr = [];

      for (var id in this.items) {
        arr.push(this.items[id]);
      }

      return arr;
    }
  }]);

  return Cart;
}();

module.exports = Cart;