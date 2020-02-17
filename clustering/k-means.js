'use strict';

Object.defineProperty(exports, "__esModule", {
  value: false
});
exports.KMeans = undefined;
exports.default = kMeans;

var _euclidean = require('../metrics/distance/euclidean');

var _euclidean2 = _interopRequireDefault(_euclidean);

var _vectors = require('../helpers/vectors');

var _random = require('pandemonium/random');

var _sample = require('pandemonium/sample');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * Talisman clustering/k-means
                                                                                                                                                           * ============================
                                                                                                                                                           *
                                                                                                                                                           * Function related to k-means clustering.
                                                                                                                                                           *
                                                                                                                                                           * [Reference]: https://en.wikipedia.org/wiki/K-means_clustering
                                                                                                                                                           */


/**
 * Default options for k-means clustering.
 */
var DEFAULTS = {
  k: 8,
  distance: _euclidean2.default,
  maxIterations: 300,
  initialCentroids: null,
  rng: Math.random,
  vector: null
};

/**
 * Helpers.
 */
function compareCentroids(a, b) {
  for (var i = 0, l = a.length; i < l; i++) {
    for (var j = 0, m = a[i].length; j < m; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }

  return true;
}

/**
 * KMeans class used to fine tune the clustering when needed & handling
 * the internal state of the process.
 *
 * @constructor
 * @param {array}          data                       - Array of vectors.
 * @param {object}         options                    - Possible options:
 * @param {number}            [k]                     - Number of clusters.
 * @param {function}          [distance]              - Distance function.
 * @param {number}            [maxIterations]
 *   - Maximum number of iterations.
 * @param {array|function}    [initialCentroids]
 *   - Either an array of initial centroids or a function computing them.
 * @param {function}          [rng]                   - RNG function to use.
 * @param {function}          [vector]                - Returning the vector.
 */

var KMeans = exports.KMeans = function () {
  function KMeans(data) {
    var _this = this;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, KMeans);

    // Enforcing data validity
    if (!Array.isArray(data)) throw Error('talisman/clustering/k-means: dataset should be an array of vectors.');

    // Properties
    this.data = data;
    this.dimension = this.data[0].length;
    this.iterations = 0;
    this.centroids = null;
    this.previousCentroids = null;

    // Options
    var rng = options.rng || DEFAULTS.rng;

    if (typeof rng !== 'function') throw new Error('talisman/clustering/k-means: `rng` should be a function.');

    var vectorGetter = 'vector' in options ? options.vector : null;

    if (vectorGetter && typeof vectorGetter !== 'function') throw new Error('talisman/clustering/k-means: `vector` should be a function.');

    if (vectorGetter) this.vectorGetter = vectorGetter;

    this.k = options.k || DEFAULTS.k;
    this.distance = options.distance || DEFAULTS.distance;
    this.maxIterations = options.maxIterations || DEFAULTS.maxIterations;
    this.sampler = (0, _sample.createSample)(rng).bind(null, this.k);
    this.randomVectorIndex = (0, _random.createRandom)(rng).bind(null, 0, this.data.length);

    // Enforcing correct options
    if (typeof this.k !== 'number' || this.k <= 0) throw Error('talisman/clustering/k-means: `k` should be > 0.');

    if (this.data.length < this.k) throw Error('talisman/clustering/k-means: k is greater than the number of provided vectors.');

    if (typeof this.distance !== 'function') throw Error('talisman/clustering/k-means: the `distance` option should be a function.');

    if (typeof this.maxIterations !== 'number' || this.maxIterations <= 0) throw Error('talisman/clustering/k-means: the `maxIterations` option should be > 0.');

    this.clusters = new Uint16Array(this.data.length);

    // Computing initial centroids
    var initialCentroids = options.initialCentroids;

    if (initialCentroids) {

      // The user is giving the initial centroids:
      if (typeof initialCentroids === 'function') initialCentroids = initialCentroids(this.data, {
        k: this.k,
        distance: this.distance,
        maxIterations: this.maxIterations
      });
    } else {

      // Else, we're gonna choose the initial centroids randomly
      initialCentroids = this.sampler(this.data);
    }

    // Ensuring the starting centroids are correct
    if (!Array.isArray(initialCentroids)) throw Error('talisman/clustering/k-means: `initialCentroids` are not an array or the function you provided to compute them returned invalid data (could be your `sampler`).');

    if (initialCentroids.length !== this.k) throw Error('talisman/clustering/k-means: you should provide k centroids (got ' + initialCentroids.length + ' instead of ' + this.k + ').');

    if (!initialCentroids.every(function (centroid) {
      return Array.isArray(centroid) && centroid.length === _this.dimension;
    })) throw Error('talisman/clustering/k-means: at least one of the provided or computed centroids is not of the correct dimension.');

    this.centroids = initialCentroids;
  }

  /**
   * Method used to perform one iteration of the clustering algorithm.
   *
   * @return {KMeans} - Returns itself for chaining.
   */


  KMeans.prototype.iterate = function iterate() {

    // If the clustering has already converged, we break
    if (this.converged) return this;

    // Initializing clusters states
    var clusterStates = new Uint8Array(this.k);

    // Iterating through the dataset's vectors
    for (var i = 0, l = this.data.length; i < l; i++) {
      var vector = this.data[i];

      // Finding the closest centroid
      var min = Infinity,
          centroidIndex = 0;

      for (var j = 0; j < this.k; j++) {
        var d = this.distance(vector, this.centroids[j]);

        if (d < min) {
          min = d;
          centroidIndex = j;
        }
      }

      // Mapping the vector to the correct centroid index
      this.clusters[i] = centroidIndex;

      // Indicating our cluster isn't empty anymore
      clusterStates[centroidIndex] = 1;
    }

    // If any of the clusters is empty, we need to give it a random vector
    var alreadyPluckedVectors = new Set();

    for (var _i = 0; _i < this.k; _i++) {
      if (!clusterStates[_i]) {

        // Finding a random vector
        var randomVectorIndex = void 0;
        do {
          randomVectorIndex = this.randomVectorIndex();
        } while (alreadyPluckedVectors.has(randomVectorIndex));

        alreadyPluckedVectors.add(randomVectorIndex);

        // Let's put it in our empty cluster
        this.clusters[randomVectorIndex] = _i;
      }
    }

    // We now find the new centroids
    this.previousCentroids = this.centroids;
    this.centroids = new Array(this.k);

    for (var _i2 = 0; _i2 < this.k; _i2++) {
      this.centroids[_i2] = (0, _vectors.vec)(this.dimension, 0);
    }var sizes = (0, _vectors.vec)(this.dimension, 0);

    for (var _i3 = 0, _l = this.data.length; _i3 < _l; _i3++) {
      var _vector = this.data[_i3],
          clusterIndex = this.clusters[_i3];

      for (var _j = 0; _j < this.dimension; _j++) {
        this.centroids[clusterIndex][_j] += _vector[_j];
      }sizes[clusterIndex]++;
    }

    for (var _i4 = 0; _i4 < this.k; _i4++) {
      for (var _j2 = 0; _j2 < this.dimension; _j2++) {
        this.centroids[_i4][_j2] /= sizes[_i4];
      }
    }

    this.iterations++;

    // Checking if the clustering has converged
    this.converged = compareCentroids(this.previousCentroids, this.centroids);

    return this;
  };

  /**
   * Method used to start the clustering process.
   *
   * @return {array} - The resulting clusters.
   */


  KMeans.prototype.run = function run() {

    // While we don't converge or haven't performed the allowed iterations:
    while (!this.converged && this.iterations < this.maxIterations) {
      this.iterate();
    } // Now we need to "compile" the clusters
    var clusters = new Array(this.k);

    for (var i = 0; i < this.k; i++) {
      clusters[i] = [];
    }for (var _i5 = 0, l = this.data.length; _i5 < l; _i5++) {
      clusters[this.clusters[_i5]].push(this.data[_i5]);
    }return clusters;
  };

  return KMeans;
}();

/**
 * Exporting a convenient function to perform simple k-means clustering.
 *
 * @param  {object} options - Clustering options.
 * @param  {array}  data    - Target dataset.
 * @param  {array}          - Resulting clusters.
 */


function kMeans(options, data) {
  var clusterer = new KMeans(data, options);

  var clusters = clusterer.run();

  return clusters;
}
module.exports = exports['default'];
exports['default'].KMeans = exports.KMeans;