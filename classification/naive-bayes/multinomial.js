'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _discrete = require('./discrete');

var _discrete2 = _interopRequireDefault(_discrete);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Talisman classification/naive-bayes/multinomial
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * ================================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Implementation of the Multinomial Naive-Bayes classifier.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * [Reference]: https://en.wikipedia.org/wiki/Naive_Bayes_classifier
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The Multinomial Naive Bayes classifier.
 *
 * @constructor
 */
var MultinomialNaiveBayes = function (_AbstractDiscreteNaiv) {
  _inherits(MultinomialNaiveBayes, _AbstractDiscreteNaiv);

  function MultinomialNaiveBayes() {
    _classCallCheck(this, MultinomialNaiveBayes);

    return _possibleConstructorReturn(this, _AbstractDiscreteNaiv.apply(this, arguments));
  }

  return MultinomialNaiveBayes;
}(_discrete2.default);

exports.default = MultinomialNaiveBayes;
module.exports = exports['default'];