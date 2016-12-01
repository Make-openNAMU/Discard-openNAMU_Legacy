var assert = require('assert');
var scrypt = require('./');

describe('scrypt-password', function() {
  describe('#create', function() {
    it('hashes given string', function() {
      assert.equal(/^\w+\$\w+\$\w+\$\w{16}\$\w{64}$/.test(scrypt.create('123qwe')), true)
    });

    it('requires password', function() {
      assert.equal(scrypt.create(), false)
    });
  });

  describe('#check', function() {
    it('checks scrypt secrets', function() {
      assert.equal(scrypt.check(scrypt.create('123qwe'), '123qwe'), true)
      assert.equal(scrypt.check(scrypt.create('123qww'), '123qww'), true)
      assert.equal(scrypt.check(scrypt.create('123qww'), '123qwe'), false)
      assert.equal(scrypt.check(scrypt.create('123qwe'), '123qww'), false)
      assert.equal(scrypt.check(scrypt.create('123qwe'), '123qww'), false)
      assert.equal(scrypt.check('400$8$42$2fc0113392594674$891642836c915eb2069747809ecc57d214cf0f7f7e32a022d37b6325527adcf5', '123qwe'), true)
      assert.equal(scrypt.check('400$8$42$2fc0113392594674$891642836c915eb2069747809ecc57d214cf0f7f7e32a022d37b6325527adcf5', '123qww'), false)
      assert.equal(scrypt.check('', '123qww'), false)
      assert.equal(scrypt.check(scrypt.create('123qwe'), null), false)
    });
  });
});
