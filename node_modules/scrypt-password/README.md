# scrypt-password

[Ruby](https://github.com/pbhogan/scrypt) compatible scrypt hashing utility for Node.js.

### Installation

    $ npm i scrypt-password

### Usage

```js
var scrypt = require('scrypt-password');

var secret = scrypt.create('123qwe');
// 400$8$1$e0882f00aa86a4ce$93bd6485319156be1474ef182bbd14d8c20952f23b9935da87a2662a8c3f5a02

scrypt.check(secret, '123qwe');
// true

scrypt.check(secret, '123qww');
// false
```

### License

MIT
