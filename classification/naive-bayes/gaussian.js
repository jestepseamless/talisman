'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _vectors = require('../../helpers/vectors');

var _matrices = require('../../helpers/matrices');

var _descriptive = require('../../stats/descriptive');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * Talisman classification/naive-bayes/gaussian
                                                                                                                                                           * =============================================
                                                                                                                                                           *
                                                                                                                                                           * Implementation of the Gaussian Naive-Bayes classifier.
                                                                                                                                                           *
                                                                                                                                                           * [Reference]: https://en.wikipedia.org/wiki/Naive_Bayes_classifier
                                                                                                                                                           */


/**
 * The Gaussian Naive Bayes classifier.
 *
 * @constructor
 */
var GaussianNaiveBayes = function () {
  function GaussianNaiveBayes() {
    _classCallCheck(this, GaussianNaiveBayes);
  }

  /**
   * Method used to reset the internal state of the classifier.
   *
   * @return {NaiveBayes} - Returns itself for chaining.
   */
  GaussianNaiveBayes.prototype.reset = function reset() {
    this.classes = null;
    this.priors = null;
    this.dimensions = 0;
    this.theta = null;
    this.sigma = null;

    return this;
  };

  /**
   * Method used to train the classifier and taking the dataset's vectors &
   * labels.
   *
   * @param  {array}      features    - Training vectors.
   * @param  {array}      labels      - Target values.
   * @return {NaiveBayes}             - Returns itself for chaining.
   *
   * @throws {Error} - Will throw if features and labels are not of same length.
   */


  GaussianNaiveBayes.prototype.fit = function fit(features, labels) {
    var nbVectors = features.length;

    if (nbVectors !== labels.length) throw Error('talisman/classification/naive-bayes/gaussian.fit: given arrays have different lengths.');

    // Resetting internal state
    this.reset();

    // Classes
    var classes = {},
        priors = {};

    // Finding unique classes
    for (var i = 0, l = labels.length; i < l; i++) {
      var label = labels[i];

      classes[label] = classes[label] || 0;
      classes[label]++;
    }

    for (var k in classes) {
      priors[k] = classes[k] / nbVectors;
    } // Lengths
    var dimensions = features[0].length;

    // Building matrices
    var matrices = {},
        offsets = {},
        featureSets = (0, _matrices.mat)(dimensions, nbVectors);

    for (var _k in classes) {
      matrices[_k] = (0, _matrices.mat)(dimensions, classes[_k]);
      offsets[_k] = (0, _vectors.vec)(dimensions, 0);
    }

    for (var _i = 0; _i < nbVectors; _i++) {
      var _label = labels[_i],
          matrix = matrices[_label];

      for (var j = 0; j < dimensions; j++) {
        matrix[j][offsets[_label][j]++] = features[_i][j];
        featureSets[j][_i] = features[_i][j];
      }
    }

    // Epsilon
    var maxVariance = Math.max.apply(Math, _toConsumableArray(featureSets.map(_descriptive.variance))),
        espilon = 1e-9 * maxVariance;

    // Computing means & variances
    var theta = {},
        sigma = {};

    for (var _k2 in matrices) {
      theta[_k2] = [];
      sigma[_k2] = [];

      for (var _i2 = 0; _i2 < dimensions; _i2++) {
        theta[_k2][_i2] = (0, _descriptive.mean)(matrices[_k2][_i2]);
        sigma[_k2][_i2] = (0, _descriptive.variance)(matrices[_k2][_i2]) + espilon;
      }
    }

    this.classes = classes;
    this.priors = priors;
    this.dimensions = dimensions;
    this.theta = theta;
    this.sigma = sigma;

    return this;
  };

  /**
   * Method used to get the joint log likelihood for a new vector.
   *
   * @param  {array} vector - The vector to classify.
   * @return {object}       - The probabilities.
   *
   * @throw {Error} - The classifier cannot predict if not yet fitted.
   * @throw {Error} - The classifier expects a vector of correct dimension.
   */


  GaussianNaiveBayes.prototype.jointLogLikelihood = function jointLogLikelihood(vector) {
    if (!this.theta) throw Error('talisman/classification/naive-bayes/gaussian.probabilities: the classifier is not yet fitted');

    if (vector.length !== this.dimensions) throw Error('talisman/classification/naive-bayes/gaussian.probabilities: the given vector is not of correct dimension (' + vector.length + ' instead of ' + this.dimensions + ').');

    var probabilities = {};

    for (var k in this.classes) {
      var theta = this.theta[k],
          sigma = this.sigma[k],
          jointi = Math.log(this.priors[k]);

      var s1 = 0,
          s2 = 0;

      for (var i = 0; i < this.dimensions; i++) {
        var t = theta[i],
            s = sigma[i],
            x = vector[i];

        s1 += Math.log(2 * Math.PI * s);
        s2 += Math.pow(x - t, 2) / s;
      }

      var nij = -0.5 * s1 - 0.5 * s2;
      probabilities[k] = jointi + nij;
    }

    return probabilities;
  };

  /**
   * Method used to classify a new vector.
   *
   * @param  {array} vector - The vector to classify.
   * @return {mixed}        - The predicted label.
   */


  GaussianNaiveBayes.prototype.predict = function predict(vector) {
    var probabilities = this.jointLogLikelihood(vector);

    // Finding the best class
    var bestClass = null,
        bestScore = -Infinity;

    for (var k in probabilities) {
      if (bestScore < probabilities[k]) {
        bestClass = k;
        bestScore = probabilities[k];
      }
    }

    return bestClass;
  };

  /**
   * Method used to export the classifier's model to a JSON representation.
   *
   * @return {object} - The JSON model.
   */


  GaussianNaiveBayes.prototype.export = function _export() {
    return {
      classes: this.classes,
      priors: this.priors,
      dimensions: this.dimensions,
      theta: this.theta,
      sigma: this.sigma
    };
  };

  /**
   * Method used to import a JSON model into the classifier.
   *
   * @param  {object}     model - The JSON model.
   * @return {NaiveBayes}       - Returns itself for chaining.
   */


  GaussianNaiveBayes.prototype.import = function _import(model) {
    this.reset();

    this.classes = model.classes;
    this.priors = model.priors;
    this.dimensions = model.dimensions;
    this.theta = model.theta;
    this.sigma = model.sigma;
  };

  /**
   * Method used to force JSON.stringify to format the classifier using the
   * #.export method.
   */


  GaussianNaiveBayes.prototype.toJSON = function toJSON() {
    return this.export();
  };

  return GaussianNaiveBayes;
}();

exports.default = GaussianNaiveBayes;
module.exports = exports['default'];