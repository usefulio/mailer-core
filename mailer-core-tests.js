Tinytest.add('Mailer - accepts an action function and options', function (test) {
  var mailer = new Mailer(function (email) {
    return true;
  }, {
    option: 'one'
  });
  test.equal(typeof mailer.action, 'function');
  test.equal(mailer.options, {option: 'one'});
});

Tinytest.add('Mailer - accepts multiple options arguments', function (test) {
  var mailer = new Mailer(function (email) {
    return this.options;
  }, {
    option: 'one'
  }, {
    option: 'two'
    , other: 'three'
  });
  test.equal(mailer.options, {option: 'two', other: 'three'});
});

Tinytest.add('Mailer - calls action when sending', function (test) {
  var mailer = new Mailer(function (email) {
    return _.extend(email, this.options);
  }, {
    option: 'one'
  });
  test.equal(mailer.send({from: 'one'}), {from: 'one', option: 'one'});
});

Tinytest.add('Mailer - passes additional options to action when sending', function (test) {
  var mailer = new Mailer(function (email) {
    return _.extend(email, this.options);
  }, {
    option: 'one'
  });
  test.equal(mailer.send({from: 'one'}, {other: 'two'}, {last: 'three'}), {
    from: 'one'
    , option: 'one'
    , other: 'two'
    , last: 'three'
  });
});
