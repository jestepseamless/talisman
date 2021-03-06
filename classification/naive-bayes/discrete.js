'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Talisman classification/naive-bayes/discrete
 * =============================================
 *
 * Abstract discrete Naive-Bayes classifier.
 *
 * [Reference]: https://en.wikipedia.org/wiki/Naive_Bayes_classifier
 */

/**
 * Abstract discrete Naive-Bayes classifier.
 *
 * @constructor
 */
var AbstractDiscreteNaiveBayes = function () {
  function AbstractDiscreteNaiveBayes(options) {
    _classCallCheck(this, AbstractDiscreteNaiveBayes);

    var _ref = options || {},
        _ref$alpha = _ref.alpha,
        alpha = _ref$alpha === undefined ? 1.0 : _ref$alpha;

    this.alpha = alpha;
  }

  /**
   * Method used to reset the internal state of the classifier.
   *
   * @return {NaiveBayes} - Returns itself for chaining.
   */


  AbstractDiscreteNaiveBayes.prototype.reset = function reset() {
    this.classes = null;
    this.counts = null;

    return this;
  };

  /**
   * Method used to train the classifier and taking the dataset's vectors &
   * labels.
   *
   * @param  {array}      features - Training vectors.
   * @param  {array}      labels   - Target values.
   * @return {NaiveBayes}          - Returns itself for chaining.
   *
   * @throws {Error} - Will throw if features and labels are not of same length.
   */


  AbstractDiscreteNaiveBayes.prototype.fit = function fit(features, labels) {
    var nbVectors = features.length;

    if (nbVectors !== labels.length) throw Error('talisman/classification/naive-bayes/discrete.fit: given arrays have different lengths.');

    // Resetting internal state
    this.reset();

    // Finding classes
    var classes = {};

    for (var i = 0, l = labels.length; i < l; i++) {
      var label = labels[i];

      classes[label] = classes[label] || 0;
      classes[label]++;
    }

    // Counting features per classes
    var counts = {};

    for (var k in classes) {
      counts[k] = {};
    }for (var _i = 0; _i < nbVectors; _i++) {
      var cls = counts[labels[_i]],
          vector = features[_i];

      for (var j = 0, _l = vector.length; j < _l; j++) {
        var value = vector[j];

        cls[value] = cls[value] || 0;
        cls[value]++;
      }
    }

    this.classes = classes;
    this.counts = counts;

    return this;
  };

  return AbstractDiscreteNaiveBayes;
}();

exports.default = AbstractDiscreteNaiveBayes;
module.exports = exports['default'];