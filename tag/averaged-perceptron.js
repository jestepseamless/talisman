'use strict';

Object.defineProperty(exports, "__esModule", {
  value: false
});
exports.analyzeSentences = analyzeSentences;
exports.normalize = normalize;
exports.extractFeatures = extractFeatures;
exports.predict = predict;

var _shuffle = require('pandemonium/shuffle');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * Talisman tag/averaged-perceptron
                                                                                                                                                           * =================================
                                                                                                                                                           *
                                                                                                                                                           * The Averaged Perceptron POS tagging method.
                                                                                                                                                           *
                                                                                                                                                           * [Author]: Matthew Honnibal
                                                                                                                                                           *
                                                                                                                                                           * [Reference]: http://spacy.io/blog/part-of-speech-POS-tagger-in-python/
                                                                                                                                                           */


/**
 * Constants.
 */
var HASH_DELIMITER = '‡';
var hasher = function hasher(a, b) {
  return a + HASH_DELIMITER + b;
};

var LOWEST_STRING = String.fromCharCode(0);

var START = ['-START-', '-START2-'],
    END = ['-END-', '-END2-'];

var HYPHEN_REGEX = /-/,
    YEAR_REGEX = /\d{4}/,
    DIGIT_REGEX = /\d/;

/**
 * Defaults.
 */
var DEFAULTS = {
  iterations: 5,
  ambiguityThreshold: 0.97,
  frequencyThreshold: 20
};

/**
 * Helpers.
 */

/**
 * Function taking training sentences and returning
 *
 * @param  {array}  sentences - Array of sentences being arrays of (word, tag).
 * @return {object}           - Found classes & tags.
 */
function analyzeSentences(sentences) {
  var classes = new Set(),
      counts = {},
      tags = {};

  // Iterating over sentences
  for (var i = 0, l = sentences.length; i < l; i++) {
    var sentence = sentences[i];

    // Iterating over words
    for (var j = 0, m = sentence.length; j < m; j++) {
      var _sentence$j = sentence[j],
          word = _sentence$j[0],
          tag = _sentence$j[1];

      classes.add(tag);

      if (!(word in counts)) counts[word] = {};
      if (!(tag in counts[word])) counts[word][tag] = 0;
      counts[word][tag]++;
    }
  }

  // Adding words to the tag dictionary
  for (var word in counts) {
    var tagFrequencies = counts[word];

    // Finding max frequency
    var max = -Infinity,
        maxTag = null,
        sum = 0;

    for (var tag in tagFrequencies) {
      var count = tagFrequencies[tag];

      if (count > max) {
        maxTag = tag;
        max = count;
      }

      sum += count;
    }

    // We don't add rare words to the dictionary, just unambiguous ones
    if (sum >= DEFAULTS.frequencyThreshold && max / sum >= DEFAULTS.ambiguityThreshold) tags[word] = maxTag;
  }

  return { classes: classes, tags: tags };
}

/**
 * Function normalizing the given word before its pass through the perceptron.
 *
 * @param  {string} word - Target word.
 * @return {string}      - Normalized word.
 */
function normalize(word) {
  if (HYPHEN_REGEX.test(word) && word[0] !== '-') return '!HYPHEN';

  if (YEAR_REGEX.test(word)) return '!YEAR';

  if (DIGIT_REGEX.test(word[0])) return '!DIGITS';

  return word.toLowerCase();
}

/**
 * Function used to build a context from the given tokenized sentence.
 *
 * @param  {array} sentence - Target sentence.
 * @return {array}          - Context.
 */
function createContext(sentence) {
  var context = new Array(sentence.length + 4);
  context[0] = START[0];
  context[1] = START[1];

  for (var j = 0, m = sentence.length; j < m; j++) {
    context[j + 2] = normalize(sentence[j][0]);
  }context[context.length - 2] = END[0];
  context[context.length - 1] = END[1];

  return context;
}

/**
 * Function extracting feature from the given word & its context.
 *
 * @param  {string} word    - Target word.
 * @param  {number} index   - Index of the word in the sentence.
 * @param  {array}  context - Word's context.
 * @param  {array}  prev    - Previous.
 * @param  {array}  prev2   - Previous 2.
 * @return {array}          - Features.
 */
function extractFeatures(index, word, context, previous, previous2) {
  var features = { bias: 1 };
  index += 2;

  features['i suffix ' + word.slice(-3)] = 1;
  features['i pref1 ' + word[0]] = 1;
  features['i-1 tag ' + previous] = 1;
  features['i-2 tag ' + previous2] = 1;
  features['i tag+i-2 tag ' + previous + ' ' + previous2] = 1;
  features['i word ' + context[index]] = 1;
  features['i-1 tag+i word ' + previous + ' ' + context[index]] = 1;
  features['i-1 word ' + context[index - 1]] = 1;
  features['i-1 suffix ' + context[index - 1].slice(-3)] = 1;
  features['i-2 word ' + context[index - 2]] = 1;
  features['i+1 word ' + context[index + 1]] = 1;
  features['i+1 suffix ' + context[index + 1].slice(-3)] = 1;
  features['i+2 word ' + context[index + 2]] = 1;

  return features;
}

/**
 * Given features, weights & classes, this function will return the best
 * label by computing the dot product of the features & weights.
 *
 * @param  {object} features - Target features.
 * @param  {object} weights  - Current weights.
 * @param  {array}  classes  - Array of possible classes.
 * @return {array}           - The best label.
 */
function predict(features, weights, classes) {
  var scores = {};

  // Iterating over features
  for (var feature in features) {
    var value = features[feature];

    if (!value || !(feature in weights)) continue;

    var relevantWeights = weights[feature];

    for (var label in relevantWeights) {
      var weight = relevantWeights[label];
      scores[label] = scores[label] || 0;
      scores[label] += value * weight;
    }
  }

  // Retrieving the best label
  var bestLabel = LOWEST_STRING,
      bestScore = -Infinity;

  // NOTE: this part is not strictly equal to its Python counterpart
  for (var i = 0, l = classes.length; i < l; i++) {
    var _label = classes[i],
        score = scores[_label] || 0;

    if (score > bestScore) {
      bestScore = score;
      bestLabel = _label;
    } else if (score === bestScore) {

      if (_label > bestLabel) bestLabel = _label;
    }
  }

  return bestLabel;
}

/**
 * The AveragedPerceptronTagger class.
 *
 * @constructor
 * @param {object}   [options]           - Customization options.
 * @param {number}   [options.iteration] - Number of training operations.
 * @param {function} [options.rng]       - RNG function.
 */

var AveragedPerceptronTagger = function () {
  function AveragedPerceptronTagger(options) {
    _classCallCheck(this, AveragedPerceptronTagger);

    options = options || {};

    this.options = {
      iterations: options.iterations || DEFAULTS.iterations
    };

    // Creating shuffler
    this.shuffle = (0, _shuffle.createShuffle)(options.rng || Math.random);

    // Properties
    this.trained = false;
    this.tags = {};
    this.classes = null;
    this.weights = {};
    this.seenInstances = 0;
    this.totals = {};
    this.timestamps = {};
  }

  /**
   * Method used to update the model's weights.
   *
   * @param  {string} truth    - The correct label.
   * @param  {string} guess    - The predicted label.
   * @param  {object} features - The features.
   * @return {AveragedPerceptronTagger} - Returns itself for chaining.
   */


  AveragedPerceptronTagger.prototype.update = function update(truth, guess, features) {
    this.seenInstances++;

    // If the guess is correct, we don't have much to do
    if (truth === guess) return this;

    for (var feature in features) {
      if (!(feature in this.weights)) this.weights[feature] = {};

      var weights = this.weights[feature];

      // For truth
      var truthKey = hasher(feature, truth),
          truthWeight = weights[truth] || 0;

      this.totals[truthKey] = this.totals[truthKey] || 0;
      this.totals[truthKey] += (this.seenInstances - (this.timestamps[truthKey] || 0)) * truthWeight;
      this.timestamps[truthKey] = this.seenInstances;
      weights[truth] = truthWeight + 1;

      // For guess
      var guessKey = hasher(feature, guess),
          guessWeight = weights[guess] || 0;

      this.totals[guessKey] = this.totals[guessKey] || 0;
      this.totals[guessKey] += (this.seenInstances - (this.timestamps[guessKey] || 0)) * guessWeight;
      this.timestamps[guessKey] = this.seenInstances;
      weights[guess] = guessWeight - 1;
    }

    return this;
  };

  /**
   * Method used to finalize training by computing average weights from
   * all iterations.
   *
   * @return {AveragedPerceptronTagger} - Returns itself for chaining.
   */


  AveragedPerceptronTagger.prototype.averageWeights = function averageWeights() {
    for (var feature in this.weights) {
      var updatedWeights = {};

      for (var label in this.weights[feature]) {
        var weight = this.weights[feature][label],
            key = hasher(feature, label);

        var total = this.totals[key];
        total += (this.seenInstances - this.timestamps[key]) * weight;

        var averaged = Math.round(total / this.seenInstances, 3);

        if (averaged) updatedWeights[label] = averaged;
      }

      this.weights[feature] = updatedWeights;
    }

    return this;
  };

  /**
   * Method used to train the tagger with the input sentences.
   *
   * @param  {array} sentences - Array of sentences being arrays of (word, tag).
   * @return {AveragedPerceptronTagger} - Returns itself for chaining.
   */


  AveragedPerceptronTagger.prototype.train = function train(sentences) {

    if (this.trained) throw Error('talisman/tag/averaged-perceptron.train: this tagger has already been trained.');

    var _analyzeSentences = analyzeSentences(sentences),
        classes = _analyzeSentences.classes,
        tags = _analyzeSentences.tags;

    // Setting properties


    this.classes = Array.from(classes);
    this.tags = tags;

    // Performing iterations
    for (var i = 0, l = this.options.iterations; i < l; i++) {
      this.iterate(sentences);

      // Shuffling the sentences for next iteration
      if (i !== l - 1) sentences = this.shuffle(sentences);
    }

    // Get average weights
    this.averageWeights();

    // Cleanup
    delete this.seenInstances;
    delete this.totals;
    delete this.timestamps;

    // The tagger is now trained
    this.trained = true;

    return this;
  };

  /**
   * Method used to perform a single training operation.
   *
   * @return {AveragedPerceptronTagger} - Returns itself for chaining.
   */


  AveragedPerceptronTagger.prototype.iterate = function iterate(sentences) {

    // Iterating over sentences
    for (var i = 0, l = sentences.length; i < l; i++) {
      var sentence = sentences[i];

      var previous = START[0],
          previous2 = START[1];

      // Building context
      var context = createContext(sentence);

      for (var j = 0, m = sentence.length; j < m; j++) {
        var _sentence$j2 = sentence[j],
            word = _sentence$j2[0],
            tag = _sentence$j2[1];

        var guess = this.tags[word];

        if (!guess) {
          var features = extractFeatures(j, word, context, previous, previous2);

          guess = predict(features, this.weights, this.classes);

          this.update(tag, guess, features);
        }

        previous2 = previous;
        previous = guess;
      }
    }

    return this;
  };

  /**
   * Method used to tag the provided tokenized sentence.
   *
   * @param  {array} sentence - Array of word tokens.
   * @return {array}          - The tagged tokens.
   */


  AveragedPerceptronTagger.prototype.tag = function tag(sentence) {
    if (!this.trained) throw Error('talisman/tag/averaged-perceptron.tag: this tagger hasn\'t been trained yet.');

    var output = new Array(sentence.length),
        context = createContext(sentence);

    var previous = START,
        previous2 = START;

    for (var i = 0, l = sentence.length; i < l; i++) {
      var word = sentence[i];

      var tag = this.tags[word];

      if (!tag) {
        var features = extractFeatures(i, word, context, previous, previous2);
        tag = predict(features, this.weights, this.classes);
      }

      output[i] = [word, tag];
      previous2 = previous;
      previous = tag;
    }

    return output;
  };

  return AveragedPerceptronTagger;
}();

exports.default = AveragedPerceptronTagger;
module.exports = exports['default'];
exports['default'].analyzeSentences = exports.analyzeSentences;
exports['default'].normalize = exports.normalize;
exports['default'].extractFeatures = exports.extractFeatures;
exports['default'].predict = exports.predict;