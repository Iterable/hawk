// Load modules

var Crypto = require('crypto');
var Url = require('url');
var Utils = require('./utils');


// Declare internals

var internals = {};


// MAC normalization format version

exports.headerVersion = '1';                        // Prevent comparison of mac values generated with different normalized string formats


// Supported HMAC algorithms

exports.algorithms = ['sha1', 'sha256'];


// Calculate the request MAC

/*
    type: 'header'                                  // 'header', 'bewit', 'response'
    options: {
        credentials: {
            key: 'aoijedoaijsdlaksjdl',
            algorithm: 'sha256'                     // 'sha1', 'sha256'
        },
        method: 'GET',
        resource: '/resource?a=1&b=2',
        host: 'example.com',
        port: 8080,
        ts: 1357718381034,
        nonce: 'd3d345f',
        hash: 'U4MKKSmiVxk37JCCrAVIjV/OhB3y+NdwoCr6RShbVkE=',
        ext: 'app-specific-data',
        app: 'hf48hd83qwkj',                        // Application id (Oz)
        dlg: 'd8djwekds9cj'                         // Delegated by application id (Oz), requires options.app
    }
*/

exports.calculateMac = function (type, options) {

    var normalized = exports.generateNormalizedString(type, options);

    var hmac = Crypto.createHmac(options.credentials.algorithm, options.credentials.key).update(normalized);
    var digest = hmac.digest('base64');
    return digest;
};


exports.generateNormalizedString = function (type, options) {

    var normalized = 'hawk.' + exports.headerVersion + '.' + type + '\n' +
                     options.ts + '\n' +
                     options.nonce + '\n' +
                     options.method.toUpperCase() + '\n' +
                     options.resource + '\n' +
                     options.host.toLowerCase() + '\n' +
                     options.port + '\n' +
                     (options.hash || '') + '\n';

    if (options.ext) {
        normalized += options.ext.replace('\\', '\\\\').replace('\n', '\\n');
    }

    normalized += '\n';

    if (options.app) {
        normalized += options.app + '\n' +
                      (options.dlg || '') + '\n';
    }

    return normalized;
};


exports.calculateHash = function (payload, algorithm, contentType) {

    var hash = Crypto.createHash(algorithm);
    hash.update('hawk.' + exports.headerVersion + '.payload\n');
    hash.update(Utils.parseContentType(contentType) + '\n');
    hash.update(payload || '');
    hash.update('\n');
    return hash.digest('base64');
};


exports.calculateTsMac = function (ts, credentials) {

    var hash = Crypto.createHash(credentials.algorithm);
    hash.update('hawk.' + exports.headerVersion + '.ts\n' + ts + '\n');
    return hash.digest('base64');
};

