'use strict';

var scrypt = require('scrypt');
var crypto = require('crypto');

function pad(str, count, char) {
  return (Array(count + 1).join(char) + str).substring(str.length);
}

exports.check = function(hash, password) {
  if (!hash || !password) return false;

  var parts = hash.split('$');
  var N = parts[0];
  var r = parts[1];
  var p = parts[2];
  var salt = parts[3];
  var secret = parts[4];
  var opts = { N: parseInt(N, 16), r: parseInt(r, 16), p: parseInt(p, 16) };
  var len = secret.length / 2;

  salt = new Buffer(salt, 'hex');
  hash = scrypt.hashSync(password, opts, len, salt).toString('hex');

  return secret === pad(hash, secret.length, '0');
}

exports.create = function(password, options, len) {
  options || (options = {});
  len     || (len = 32);

  if (!password) return false;

  // FIXME: opts = scrypt.paramsSync(options.maxtime || .2, options.maxmem, options.maxmemfrac);
  var opts = { N: 1024, r: 8, p: 1 };
  var salt = crypto.randomBytes(8);
  var hash = scrypt.hashSync(password, opts, len, salt).toString('hex');

  return [
    opts.N.toString(16),
    opts.r.toString(16),
    opts.p.toString(16),
    salt.toString('hex'),
    pad(hash, len * 2, '0')
  ].join('$');
}
