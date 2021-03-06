'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _vectors = require('../helpers/vectors');

var _random = require('lodash/random');

var _random2 = _interopRequireDefault(_random);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * Talisman classification/perceptron
                                                                                                                                                           * ===================================
                                                                                                                                                           *
                                                                                                                                                           * Implementation of the Perceptron linear classifier.
                                                                                                                                                           *
                                                                                                                                                           * [Reference]: https://en.wikipedia.org/wiki/Perceptron
                                                                                                                                                           */


/**
 * The Heaviside step function.
 */
var step = function step(x) {
  return x < 0 ? 0 : 1;
};

/**
 * Getting a random index from the given list.
 */
function randomIndex(list) {
  return (0, _random2.default)(0, list.length - 1);
}

/**
 * The Perceptron classifier.
 *
 * @constructor
 */

var Perceptron = function () {
  function Perceptron(options) {
    _classCallCheck(this, Perceptron);

    var _ref = options || {},
        _ref$learningRate = _ref.learningRate,
        learningRate = _ref$learningRate === undefined ? 1 : _ref$learningRate,
        _ref$iterations = _ref.iterations,
        iterations = _ref$iterations === undefined ? 5 : _ref$iterations;

    if (learningRate <= 0 || learningRate > 1) throw Error('talisman/classification/perceptron: the learning rate should be comprised between 0 and 1 inclusive.');

    this.options = {
      learningRate: learningRate,
      iterations: iterations
    };
  }

  /**
   * Method used to reset the internal state of the Perceptron.
   *
   * @return {Perceptron}           - Returns itself for chaining purposes.
   */


  Perceptron.prototype.reset = function reset() {
    this.dimensions = 0;
    this.weights = null;
  };

  /**
   * Method used to train the Perceptron.
   *
   * @param  {array}       features - Training vectors.
   * @param  {array}       labels   - Target value (0 or 1).
   * @return {Perceptron}           - Returns itself for chaining purposes.
   *
   * @throws {Error} - Will throw if features and labels are not of same length.
   */


  Perceptron.prototype.fit = function fit(features, labels) {
    if (features.length !== labels.length) throw Error('talisman/classification/perceptron.fit: given arrays have different lengths.');

    // Resetting internal state
    this.reset();

    var dimensions = features[0].length;

    var weights = new Array(dimensions);

    for (var i = 0; i < dimensions; i++) {
      weights[i] = Math.random();
    } // Performing iterations
    for (var _i = 0, l = this.options.iterations; _i < l; _i++) {
      var index = randomIndex(features),
          vector = features[index],
          expected = +!!labels[index],
          result = (0, _vectors.dot)(weights, vector),
          error = expected - step(result);

      // Adjusting weights
      var adjustment = (0, _vectors.scale)(vector, this.options.learningRate * error);
      weights = (0, _vectors.add)(weights, adjustment);
    }

    this.dimensions = dimensions;
    this.weights = weights;

    return this;
  };

  /**
   * Method used to classify a new vector.
   *
   * @param  {array} vector - The vector to classify.
   * @return {number}       - The predicted label (0 or 1).
   *
   * @throw {Error} - The classifier cannot predict if not yet fitted.
   * @throw {Error} - The classifier expects a vector of correct dimension.
   */


  Perceptron.prototype.predict = function predict(vector) {

    if (!this.weights) throw Error('talisman/classification/perceptron.probabilities: the classifier is not yet fitted');

    if (vector.length !== this.dimensions) throw Error('talisman/classification/perceptron.probabilities: the given vector is not of correct dimension (' + vector.length + ' instead of ' + this.dimensions + ').');

    return step((0, _vectors.dot)(vector, this.weights));
  };

  return Perceptron;
}();

exports.default = Perceptron;
module.exports = exports['default'];