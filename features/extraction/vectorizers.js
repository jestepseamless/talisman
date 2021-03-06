'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collectionVectorizer = collectionVectorizer;
exports.bagOfWordsVectorizer = bagOfWordsVectorizer;
exports.countVectorizer = countVectorizer;
exports.tfidfVectorizer = tfidfVectorizer;
/* eslint no-loop-func: 0 */
/**
 * Talisman features/extraction/vectorizers
 * =========================================
 *
 * Compilation of vectorizers aiming at transforming data into
 * feature matrices used by machine learning methods.
 */

/**
 * Vectorizer taking a collection as input and outputting a feature matrix.
 *
 * @param  {object}   options             - Options to customize the output.
 * @param  {function} [options.type]      - Array class to use.
 * @param  {string}   [options.separator] - Separator to use in qualitative
 *                                          headers name.
 * @param  {array}    collection          - The target collection (array of
 *                                          objects).
 * @return {object}                       - An object containing the result
 *                                          (meta, headers & features).
 */
var DEFAULT_COLLECTION_OPTIONS = {
  type: Array,
  separator: '='
};

function collectionVectorizer(options, collection) {
  options = options || {};

  var ArrayClass = options.type || DEFAULT_COLLECTION_OPTIONS.type,
      separator = options.separator || DEFAULT_COLLECTION_OPTIONS.separator;

  // Doing a first pass to assess the content of the collection
  var fields = {};

  for (var i = 0, l = collection.length; i < l; i++) {
    var item = collection[i];

    // Checking every field
    for (var k in item) {
      var value = item[k],
          quantitative = typeof value === 'number';

      if (!(k in fields)) {
        fields[k] = {
          values: new Set(),
          quantitative: quantitative
        };
      }

      fields[k].values.add('' + value);
      fields[k].quantitative = fields[k].quantitative && quantitative;
    }
  }

  // Building the meta
  var meta = {},
      quantitativeFields = new Set();

  var length = 0;

  var _loop = function _loop(_k) {
    var _fields$_k = fields[_k],
        quantitative = _fields$_k.quantitative,
        values = _fields$_k.values;


    if (quantitative) {
      meta[_k] = {
        index: length++,
        quantitative: quantitative
      };

      quantitativeFields.add(_k);
    } else {
      values.forEach(function (value) {
        meta['' + _k + separator + value] = {
          index: length++,
          quantitative: quantitative
        };
      });
    }
  };

  for (var _k in fields) {
    _loop(_k);
  }

  // Building the features matrix
  var features = new Array(collection.length);

  for (var _i = 0, _l = collection.length; _i < _l; _i++) {
    var _item = collection[_i];

    features[_i] = new ArrayClass(length);

    for (var _k2 in _item) {
      var _value = _item[_k2],
          _quantitative = quantitativeFields.has(_k2),
          h = _quantitative ? _k2 : '' + _k2 + separator + _value,
          index = meta[h].index;

      features[_i][index] = _quantitative ? _value : 1;
    }
  }

  // Building the headers
  var headers = Object.keys(meta).map(function (k) {
    return k;
  });

  return {
    headers: headers,
    meta: meta,
    features: features
  };
}

/**
 * Vectorizer taking a list of tokenized documents as input and outputting a
 * "bag of words" features matrix.
 *
 * @param  {object}   options             - Options to customize the output.
 * @param  {function} [options.type]      - Array class to use.
 * @param  {array}    documents           - The documents to process.
 * @return {object}                       - An object containing the result
 *                                          (meta, headers & features).
 */
var DEFAULT_TEXT_OPTIONS = {
  type: Array
};

function bagOfWordsVectorizer(options, documents) {
  options = options || {};

  var ArrayClass = options.type || DEFAULT_TEXT_OPTIONS.type;

  // Iterating through documents to gather every word
  var words = {};
  var index = 0;

  for (var i = 0, l = documents.length; i < l; i++) {
    var doc = documents[i];

    for (var j = 0, m = doc.length; j < m; j++) {
      if (!(doc[j] in words)) words[doc[j]] = index++;
    }
  }

  // Building headers & features matrix
  var headers = Object.keys(words),
      features = new Array(documents.length);

  for (var _i2 = 0, _l2 = documents.length; _i2 < _l2; _i2++) {
    var _doc = documents[_i2];

    features[_i2] = new ArrayClass(headers.length);

    for (var _j = 0, _m = _doc.length; _j < _m; _j++) {
      features[_i2][words[_doc[_j]]] = 1;
    }
  }

  return {
    headers: headers,
    features: features
  };
}

/**
 * Vectorizer taking a list of tokenized documents as input and outputting a
 * features matrix containing the count of each word in the document.
 *
 * @param  {object}   options             - Options to customize the output.
 * @param  {function} [options.type]      - Array class to use.
 * @param  {array}    documents           - The documents to process.
 * @return {object}                       - An object containing the result
 *                                          (meta, headers & features).
 */
function countVectorizer(options, documents) {
  options = options || {};

  var ArrayClass = options.type || DEFAULT_TEXT_OPTIONS.type;

  // Iterating through documents to gather every word
  var words = {};
  var index = 0;

  for (var i = 0, l = documents.length; i < l; i++) {
    var doc = documents[i];

    for (var j = 0, m = doc.length; j < m; j++) {
      if (!(doc[j] in words)) words[doc[j]] = index++;
    }
  }

  // Building headers & features matrix
  var headers = Object.keys(words),
      features = new Array(documents.length);

  for (var _i3 = 0, _l3 = documents.length; _i3 < _l3; _i3++) {
    var _doc2 = documents[_i3];

    features[_i3] = new ArrayClass(headers.length);

    for (var _j2 = 0, _m2 = _doc2.length; _j2 < _m2; _j2++) {
      var k = words[_doc2[_j2]];
      features[_i3][k] = features[_i3][k] || 0;
      features[_i3][k]++;
    }
  }

  return {
    headers: headers,
    features: features
  };
}

/**
 * Vectorizer taking a list of tokenized documents as input and outputting a
 * features matrix containing the tfidf metric for each word in the document.
 *
 * @param  {object}   options             - Options to customize the output.
 * @param  {function} [options.type]      - Array class to use.
 * @param  {array}    documents           - The documents to process.
 * @return {object}                       - An object containing the result
 *                                          (meta, headers & features).
 */
function tfidfVectorizer(options, documents) {
  options = options || {};

  var ArrayClass = options.type || DEFAULT_TEXT_OPTIONS.type;

  // Iterating through documents to gather every word
  var words = {},
      termFrequencies = [];

  var index = 0;

  for (var i = 0, l = documents.length; i < l; i++) {
    var doc = documents[i];

    termFrequencies.push({});

    for (var j = 0, m = doc.length; j < m; j++) {
      var word = doc[j];

      if (!(word in words)) words[word] = {
        index: index++,
        idf: 0
      };

      words[word].idf++;

      termFrequencies[i][word] = termFrequencies[i][word] || 0;
      termFrequencies[i][word]++;
    }
  }

  // Computing inverse document frequencies
  for (var _word in words) {
    words[_word].idf = Math.log(documents.length / words[_word].idf);
  } // Building headers & features matrix
  var headers = Object.keys(words),
      features = new Array(documents.length);

  for (var _i4 = 0, _l4 = documents.length; _i4 < _l4; _i4++) {
    var _doc3 = documents[_i4],
        tfs = termFrequencies[_i4];

    features[_i4] = new ArrayClass(headers.length);

    for (var _j3 = 0, _m3 = _doc3.length; _j3 < _m3; _j3++) {
      var _words$_doc3$_j = words[_doc3[_j3]],
          k = _words$_doc3$_j.index,
          idf = _words$_doc3$_j.idf;

      features[_i4][k] = tfs[_doc3[_j3]] * idf;
    }
  }

  return {
    headers: headers,
    features: features
  };
}