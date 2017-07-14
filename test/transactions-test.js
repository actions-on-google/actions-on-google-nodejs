/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// Enable actions-on-google debug logging
process.env.DEBUG = 'actions-on-google:*';

/**
 * Test suite for the actions client library.
 */
const winston = require('winston');
const chai = require('chai');
const expect = chai.expect;
const {
  TransactionValues,
  Order,
  Cart,
  LineItem,
  OrderUpdate
} = require('.././transactions');

// Default logger
winston.loggers.add('DEFAULT_LOGGER', {
  console: {
    level: 'error',
    colorize: true,
    label: 'Default logger',
    json: true,
    timestamp: true
  }
});

/**
 * Describes the behavior for Order interface.
 */
describe('Order', () => {
  describe('#constructor', () => {
    it('should create valid object', () => {
      let order = new Order('test_id');
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: []
      });
    });
  });

  describe('#setCart', () => {
    let order;

    beforeEach(() => {
      order = new Order('test_id');
    });

    it('should set the cart', () => {
      order.setCart({
        test_property: 'test_value'
      });
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        cart: {
          test_property: 'test_value'
        }
      });
    });

    it('should overwrite previously set cart', () => {
      order.setCart({
        test_property: 'test_old_value'
      });
      order.setCart({
        test_property: 'test_value'
      });
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        cart: {
          test_property: 'test_value'
        }
      });
    });
  });

  describe('#addOtherItems', () => {
    let order;

    beforeEach(() => {
      order = new Order('test_id');
    });

    it('should add a single other item', () => {
      order.addOtherItems({
        new_item: 'new_item'
      });
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [{
          new_item: 'new_item'
        }]
      });
    });

    it('should add multiple other items', () => {
      order.addOtherItems([
        {
          new_item: 'new_item'
        },
        {
          new_item: 'new_item_2'
        }]);
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [
          {
            new_item: 'new_item'
          },
          {
            new_item: 'new_item_2'
          }]
      });
    });
  });

  describe('#setImage', () => {
    let order;

    beforeEach(() => {
      order = new Order('test_id');
    });

    it('should set the image', () => {
      order.setImage('http://image.com', 'ALT_TEXT', 100, 150);
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        image: {
          url: 'http://image.com',
          accessibilityText: 'ALT_TEXT',
          width: 100,
          height: 150
        }
      });
    });

    it('should overwrite previously set image', () => {
      order.setImage('http://image.com', 'ALT_TEXT', 100, 150);
      order.setImage('http://image.com/2', 'ALT_TEXT_2');
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        image: {
          url: 'http://image.com/2',
          accessibilityText: 'ALT_TEXT_2'
        }
      });
    });
  });

  describe('#setTOS', () => {
    let order;

    beforeEach(() => {
      order = new Order('test_id');
    });

    it('should set the TOS', () => {
      order.setTermsOfService('http://example.com');
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        termsOfServiceUrl: 'http://example.com'
      });
    });

    it('should overwrite previously set TOS', () => {
      order.setTermsOfService('http://example.com');
      order.setTermsOfService('http://example.com/2');
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        termsOfServiceUrl: 'http://example.com/2'
      });
    });
  });

  describe('#setTotalPrice', () => {
    let order;

    beforeEach(() => {
      order = new Order('test_id');
    });

    it('should set the price', () => {
      order.setTotalPrice('ACTUAL', 'USD', 30, 40);
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        totalPrice: {
          type: 'ACTUAL',
          amount: {
            currencyCode: 'USD',
            units: 30,
            nanos: 40
          }
        }
      });
    });

    it('should overwrite previously set price', () => {
      order.setTotalPrice('ACTUAL', 'USD', 30, 40);
      order.setTotalPrice('ESTIMATE', 'GBP', 60);
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        totalPrice: {
          type: 'ESTIMATE',
          amount: {
            currencyCode: 'GBP',
            units: 60,
            nanos: 0
          }
        }
      });
    });
  });

  describe('#setTime', () => {
    let order;

    beforeEach(() => {
      order = new Order('test_id');
    });

    it('should set the time', () => {
      order.setTime('TIME_TYPE', 'SAMPLE_TIME');
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        extension: {
          '@type': 'type.googleapis.com/google.actions.v2.orders.GenericExtension',
          time: {
            type: 'TIME_TYPE',
            time_iso8601: 'SAMPLE_TIME'
          }
        }
      });
    });

    it('should overwrite the previously set time', () => {
      order.setTime('TIME_TYPE', 'SAMPLE_TIME');
      order.setTime('TIME_TYPE_2', 'SAMPLE_TIME_2');
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        extension: {
          '@type': 'type.googleapis.com/google.actions.v2.orders.GenericExtension',
          time: {
            type: 'TIME_TYPE_2',
            time_iso8601: 'SAMPLE_TIME_2'
          }
        }
      });
    });
  });

  describe('#addLocation', () => {
    let order;

    const locationOne = {
      type: 'LOCATION_TYPE',
      location: {
        postalAddress: 'SAMPLE_ADDRESS'
      }
    };

    const locationTwo = {
      type: 'LOCATION_TYPE_2',
      location: {
        postalAddress: 'SAMPLE_ADDRESS_2'
      }
    };

    const locationThree = {
      type: 'LOCATION_TYPE_3',
      location: {
        postalAddress: 'SAMPLE_ADDRESS_3'
      }
    };

    beforeEach(() => {
      order = new Order('test_id');
    });

    it('should add one location', () => {
      order.addLocation(locationOne.type, locationOne.location);
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        extension: {
          '@type': 'type.googleapis.com/google.actions.v2.orders.GenericExtension',
          locations: [locationOne]
        }
      });
    });

    it('should add a second location', () => {
      order.addLocation(locationOne.type, locationOne.location);
      order.addLocation(locationTwo.type, locationTwo.location);
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        extension: {
          '@type': 'type.googleapis.com/google.actions.v2.orders.GenericExtension',
          locations: [locationOne, locationTwo]
        }
      });
    });

    it('should not add a third location', () => {
      order.addLocation(locationOne.type, locationOne.location);
      order.addLocation(locationTwo.type, locationTwo.location);
      order.addLocation(locationThree.type, locationThree.location);
      expect(JSON.parse(JSON.stringify(order))).to.deep.equal({
        id: 'test_id',
        otherItems: [],
        extension: {
          '@type': 'type.googleapis.com/google.actions.v2.orders.GenericExtension',
          locations: [locationOne, locationTwo]
        }
      });
    });
  });
});

/**
 * Describes the behavior for Cart interface.
 */
describe('Cart', () => {
  describe('#constructor', () => {
    it('should create valid object', () => {
      let cart = new Cart('test_id');
      expect(JSON.parse(JSON.stringify(cart))).to.deep.equal({
        id: 'test_id',
        lineItems: [],
        otherItems: []
      });
    });
  });

  describe('#setMerchant', () => {
    let cart;

    beforeEach(() => {
      cart = new Cart('test_id');
    });

    it('should set the merchant', () => {
      cart.setMerchant('merchant_id', 'My Merchant');
      expect(JSON.parse(JSON.stringify(cart))).to.deep.equal({
        id: 'test_id',
        lineItems: [],
        otherItems: [],
        merchant: {
          id: 'merchant_id',
          name: 'My Merchant'
        }
      });
    });

    it('should overwrite previously set merchant', () => {
      cart.setMerchant('merchant_id', 'My Merchant');
      cart.setMerchant('merchant_id_2', 'Your Merchant');
      expect(JSON.parse(JSON.stringify(cart))).to.deep.equal({
        id: 'test_id',
        lineItems: [],
        otherItems: [],
        merchant: {
          id: 'merchant_id_2',
          name: 'Your Merchant'
        }
      });
    });
  });

  describe('#setNotes', () => {
    let cart;

    beforeEach(() => {
      cart = new Cart('test_id');
    });

    it('should set the notes', () => {
      cart.setNotes('order notes');
      expect(JSON.parse(JSON.stringify(cart))).to.deep.equal({
        id: 'test_id',
        lineItems: [],
        otherItems: [],
        notes: 'order notes'
      });
    });

    it('should overwrite previously set notes', () => {
      cart.setNotes('order notes');
      cart.setNotes('order notes 2');
      expect(JSON.parse(JSON.stringify(cart))).to.deep.equal({
        id: 'test_id',
        lineItems: [],
        otherItems: [],
        notes: 'order notes 2'
      });
    });
  });

  describe('#addLineItems', () => {
    let cart;

    beforeEach(() => {
      cart = new Cart('test_id');
    });

    it('should add a single other item', () => {
      cart.addLineItems({
        new_item: 'new_item'
      });
      expect(JSON.parse(JSON.stringify(cart))).to.deep.equal({
        id: 'test_id',
        lineItems: [{
          new_item: 'new_item'
        }],
        otherItems: []
      });
    });

    it('should add multiple other items', () => {
      cart.addLineItems([
        {
          new_item: 'new_item'
        },
        {
          new_item: 'new_item_2'
        }]);
      expect(JSON.parse(JSON.stringify(cart))).to.deep.equal({
        id: 'test_id',
        lineItems: [
          {
            new_item: 'new_item'
          },
          {
            new_item: 'new_item_2'
          }],
        otherItems: []
      });
    });
  });

  describe('#addOtherItems', () => {
    let cart;

    beforeEach(() => {
      cart = new Cart('test_id');
    });

    it('should add a single other item', () => {
      cart.addOtherItems({
        new_item: 'new_item'
      });
      expect(JSON.parse(JSON.stringify(cart))).to.deep.equal({
        id: 'test_id',
        lineItems: [],
        otherItems: [{
          new_item: 'new_item'
        }]
      });
    });

    it('should add multiple other items', () => {
      cart.addOtherItems([
        {
          new_item: 'new_item'
        },
        {
          new_item: 'new_item_2'
        }]);
      expect(JSON.parse(JSON.stringify(cart))).to.deep.equal({
        id: 'test_id',
        lineItems: [],
        otherItems: [
          {
            new_item: 'new_item'
          },
          {
            new_item: 'new_item_2'
          }]
      });
    });
  });
});

/**
 * Describes the behavior for LineItem interface.
 */
describe('LineItem', () => {
  describe('#constructor', () => {
    it('should create valid object', () => {
      let lineItem = new LineItem('test_item_id', 'test_item');
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item'
      });
    });
  });

  describe('#addSublines', () => {
    let lineItem;

    beforeEach(() => {
      lineItem = new LineItem('test_item_id', 'test_item');
    });

    it('should add a single subline', () => {
      lineItem.addSublines({
        new_item: 'new_item'
      });
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        sublines: [{
          new_item: 'new_item'
        }]
      });
    });

    it('should add multiple sublines', () => {
      lineItem.addSublines([
        {
          new_item: 'new_item'
        },
        {
          new_item: 'new_item_2'
        }]);
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        sublines: [
          {
            new_item: 'new_item'
          },
          {
            new_item: 'new_item_2'
          }
        ]
      });
    });
  });

  describe('#setImage', () => {
    let lineItem;

    beforeEach(() => {
      lineItem = new LineItem('test_item_id', 'test_item');
    });

    it('should set the image', () => {
      lineItem.setImage('http://image.com', 'ALT_TEXT', 100, 150);
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        image: {
          url: 'http://image.com',
          accessibilityText: 'ALT_TEXT',
          width: 100,
          height: 150
        }
      });
    });

    it('should overwrite previously set image', () => {
      lineItem.setImage('http://image.com', 'ALT_TEXT', 100, 150);
      lineItem.setImage('http://image.com/2', 'ALT_TEXT_2');
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        image: {
          url: 'http://image.com/2',
          accessibilityText: 'ALT_TEXT_2'
        }
      });
    });
  });

  describe('#setPrice', () => {
    let lineItem;

    beforeEach(() => {
      lineItem = new LineItem('test_item_id', 'test_item');
    });

    it('should set the price', () => {
      lineItem.setPrice('ACTUAL', 'USD', 30, 40);
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        price: {
          type: 'ACTUAL',
          amount: {
            currencyCode: 'USD',
            units: 30,
            nanos: 40
          }
        }
      });
    });

    it('should overwrite previously set price', () => {
      lineItem.setPrice('ACTUAL', 'USD', 30, 40);
      lineItem.setPrice('ESTIMATE', 'GBP', 60);
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        price: {
          type: 'ESTIMATE',
          amount: {
            currencyCode: 'GBP',
            units: 60,
            nanos: 0
          }
        }
      });
    });
  });

  describe('#setType', () => {
    let lineItem;

    beforeEach(() => {
      lineItem = new LineItem('test_item_id', 'test_item');
    });

    it('should set the type', () => {
      lineItem.setType('REGULAR');
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        type: 'REGULAR'
      });
    });

    it('should overwrite previously set type', () => {
      lineItem.setType('REGULAR');
      lineItem.setType('FEE');
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        type: 'FEE'
      });
    });
  });

  describe('#setQuantity', () => {
    let lineItem;

    beforeEach(() => {
      lineItem = new LineItem('test_item_id', 'test_item');
    });

    it('should set the quantity', () => {
      lineItem.setQuantity(1);
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        quantity: 1
      });
    });

    it('should overwrite previously set quantity', () => {
      lineItem.setQuantity(1);
      lineItem.setQuantity(2);
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        quantity: 2
      });
    });
  });

  describe('#setDescription', () => {
    let lineItem;

    beforeEach(() => {
      lineItem = new LineItem('test_item_id', 'test_item');
    });

    it('should set the description', () => {
      lineItem.setDescription('A great item');
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        description: 'A great item'
      });
    });

    it('should overwrite previously set description', () => {
      lineItem.setDescription('A great item');
      lineItem.setDescription('A good item');
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        description: 'A good item'
      });
    });
  });

  describe('#setOfferId', () => {
    let lineItem;

    beforeEach(() => {
      lineItem = new LineItem('test_item_id', 'test_item');
    });

    it('should set the offerId', () => {
      lineItem.setOfferId('offer');
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        offerId: 'offer'
      });
    });

    it('should overwrite previously set offerId', () => {
      lineItem.setOfferId('offer');
      lineItem.setOfferId('24 hr offer');
      expect(JSON.parse(JSON.stringify(lineItem))).to.deep.equal({
        id: 'test_item_id',
        name: 'test_item',
        offerId: '24 hr offer'
      });
    });
  });
});

/**
 * Describes the behavior for OrderUpdate interface.
 */
describe('OrderUpdate', () => {
  describe('#constructor', () => {
    it('should create valid object with Google order ID', () => {
      let orderUpdate = new OrderUpdate('order_id', true);
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: []
      });
    });

    it('should create valid object with Action order ID', () => {
      let orderUpdate = new OrderUpdate('order_id', false);
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        actionOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: []
      });
    });
  });

  describe('#setTotalPrice', () => {
    let orderUpdate;

    beforeEach(() => {
      orderUpdate = new OrderUpdate('order_id', true);
    });

    it('should set the price', () => {
      orderUpdate.setTotalPrice('ACTUAL', 'USD', 30, 40);
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [],
        totalPrice: {
          type: 'ACTUAL',
          amount: {
            currencyCode: 'USD',
            units: 30,
            nanos: 40
          }
        }
      });
    });

    it('should overwrite previously set price', () => {
      orderUpdate.setTotalPrice('ACTUAL', 'USD', 30, 40);
      orderUpdate.setTotalPrice('ESTIMATE', 'GBP', 60);
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [],
        totalPrice: {
          type: 'ESTIMATE',
          amount: {
            currencyCode: 'GBP',
            units: 60,
            nanos: 0
          }
        }
      });
    });
  });

  describe('#setOrderState', () => {
    let orderUpdate;

    beforeEach(() => {
      orderUpdate = new OrderUpdate('order_id', true);
    });

    it('should set the state', () => {
      orderUpdate.setOrderState('CONFIRMED', 'Your order was confirmed');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [],
        orderState: {
          state: 'CONFIRMED',
          label: 'Your order was confirmed'
        }
      });
    });

    it('should overwrite previously set state', () => {
      orderUpdate.setOrderState('CONFIRMED', 'Your order was confirmed');
      orderUpdate.setOrderState('CANCELLED', 'Your order was canceled');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [],
        orderState: {
          state: 'CANCELLED',
          label: 'Your order was canceled'
        }
      });
    });
  });

  describe('#setUpdateTime', () => {
    let orderUpdate;

    beforeEach(() => {
      orderUpdate = new OrderUpdate('order_id', true);
    });

    it('should set the update time', () => {
      orderUpdate.setUpdateTime(200, 300);
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [],
        updateTime: {
          seconds: 200,
          nanos: 300
        }
      });
    });

    it('should overwrite previously set update time', () => {
      orderUpdate.setUpdateTime(200, 300);
      orderUpdate.setUpdateTime(100);
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [],
        updateTime: {
          seconds: 100,
          nanos: 0
        }
      });
    });
  });

  describe('#setUserNotification', () => {
    let orderUpdate;

    beforeEach(() => {
      orderUpdate = new OrderUpdate('order_id', true);
    });

    it('should set the user notification', () => {
      orderUpdate.setUserNotification('Title', 'Order updated!');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [],
        userNotification: {
          title: 'Title',
          text: 'Order updated!'
        }
      });
    });

    it('should overwrite previously set user notification', () => {
      orderUpdate.setUserNotification('Title', 'Order updated!');
      orderUpdate.setUserNotification('Title_2', 'Your order updated!');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [],
        userNotification: {
          title: 'Title_2',
          text: 'Your order updated!'
        }
      });
    });
  });

  describe('#addOrderManagementAction', () => {
    let orderUpdate;

    beforeEach(() => {
      orderUpdate = new OrderUpdate('order_id', true);
    });

    it('should add order management actions', () => {
      orderUpdate.addOrderManagementAction('MODIFY', 'Modify here',
        'http://example.com');
      orderUpdate.addOrderManagementAction('CANCEL', 'Cancel here',
        'http://example.com/cancel');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [{
          type: 'MODIFY',
          button: {
            title: 'Modify here',
            openUrlAction: {
              url: 'http://example.com'
            }
          }
        }, {
          type: 'CANCEL',
          button: {
            title: 'Cancel here',
            openUrlAction: {
              url: 'http://example.com/cancel'
            }
          }
        }]
      });
    });
  });

  describe('#setInfo', () => {
    let orderUpdate;

    beforeEach(() => {
      orderUpdate = new OrderUpdate('order_id', true);
    });

    it('should set the order update info', () => {
      orderUpdate.setInfo(TransactionValues.OrderStateInfo.RECEIPT,
        { receipt_info: 'value' });
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [],
        receipt: {
          receipt_info: 'value'
        }
      });
    });

    it('should override previously set order update info', () => {
      orderUpdate.setInfo(TransactionValues.OrderStateInfo.RECEIPT,
        { receipt_info: 'value' });
      orderUpdate.setInfo(TransactionValues.OrderStateInfo.REJECTION,
        { reason: 'value' });
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: [],
        rejectionInfo: {
          reason: 'value'
        }
      });
    });

    it('should recognize invalid update info types', () => {
      orderUpdate.setInfo('FAKE', { receipt_info: 'value' });
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: []
      });
    });
  });

  describe('#addLineItemPriceUpdate', () => {
    let orderUpdate;

    beforeEach(() => {
      orderUpdate = new OrderUpdate('order_id', true);
    });

    it('should add a new update for line item', () => {
      orderUpdate.addLineItemPriceUpdate('item_id', 'ACTUAL', 'USD', 30, 40,
        'reason');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {
          item_id: {
            price: {
              type: 'ACTUAL',
              amount: {
                currencyCode: 'USD',
                units: 30,
                nanos: 40
              }
            },
            reason: 'reason'
          }
        },
        orderManagementActions: []
      });
    });

    it('should fail for new item update without reason', () => {
      orderUpdate.addLineItemPriceUpdate('item_id', 'ACTUAL', 'USD', 30, 40);
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {},
        orderManagementActions: []
      });
    });

    it('should append price update for existing line item', () => {
      orderUpdate.lineItemUpdates.item_id = {
        orderState: 'orderState',
        reason: 'old_reason'
      };
      orderUpdate.addLineItemPriceUpdate('item_id', 'ACTUAL', 'USD', 30, 40,
        'reason');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {
          item_id: {
            price: {
              type: 'ACTUAL',
              amount: {
                currencyCode: 'USD',
                units: 30,
                nanos: 40
              }
            },
            orderState: 'orderState',
            reason: 'reason'
          }
        },
        orderManagementActions: []
      });
    });

    it('should fail to update price for existing line item without reason', () => {
      orderUpdate.lineItemUpdates.item_id = {
        orderState: 'orderState'
      };
      orderUpdate.addLineItemPriceUpdate('item_id', 'ACTUAL', 'USD', 30, 40);
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {
          item_id: {
            orderState: 'orderState'
          }
        },
        orderManagementActions: []
      });
    });
  });

  describe('#addLineItemStateUpdate', () => {
    let orderUpdate;

    beforeEach(() => {
      orderUpdate = new OrderUpdate('order_id', true);
    });

    it('should add a new update for line item', () => {
      orderUpdate.addLineItemStateUpdate('item_id', 'CONFIRMED',
        'Confirmed item', 'reason');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {
          item_id: {
            orderState: {
              state: 'CONFIRMED',
              label: 'Confirmed item'
            },
            reason: 'reason'
          }
        },
        orderManagementActions: []
      });
    });

    it('should succeed for new item update without reason', () => {
      orderUpdate.addLineItemStateUpdate('item_id', 'CONFIRMED',
        'Confirmed item');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {
          item_id: {
            orderState: {
              state: 'CONFIRMED',
              label: 'Confirmed item'
            }
          }
        },
        orderManagementActions: []
      });
    });

    it('should append state update for existing line item', () => {
      orderUpdate.lineItemUpdates.item_id = {
        price: {
          type: 'ACTUAL',
          amount: {
            currencyCode: 'USD',
            units: 30,
            nanos: 40
          }
        },
        reason: 'old_reason'
      };
      orderUpdate.addLineItemStateUpdate('item_id', 'CONFIRMED',
        'Confirmed item', 'reason');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {
          item_id: {
            price: {
              type: 'ACTUAL',
              amount: {
                currencyCode: 'USD',
                units: 30,
                nanos: 40
              }
            },
            orderState: {
              state: 'CONFIRMED',
              label: 'Confirmed item'
            },
            reason: 'reason'
          }
        },
        orderManagementActions: []
      });
    });

    it('should succeed to update state for existing line item without reason', () => {
      orderUpdate.lineItemUpdates.item_id = {
        price: {
          type: 'ACTUAL',
          amount: {
            currencyCode: 'USD',
            units: 30,
            nanos: 40
          }
        }
      };
      orderUpdate.addLineItemStateUpdate('item_id', 'CONFIRMED',
        'Confirmed item');
      expect(JSON.parse(JSON.stringify(orderUpdate))).to.deep.equal({
        googleOrderId: 'order_id',
        lineItemUpdates: {
          item_id: {
            price: {
              type: 'ACTUAL',
              amount: {
                currencyCode: 'USD',
                units: 30,
                nanos: 40
              }
            },
            orderState: {
              state: 'CONFIRMED',
              label: 'Confirmed item'
            }
          }
        },
        orderManagementActions: []
      });
    });
  });
});
