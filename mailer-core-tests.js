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

Tinytest.add('Mailer - Mailer.compose runs multiple actions in a chain', function (test) {
  var sender = new Mailer(function (email) {
    email.sent = true;
    return email;
  });
  var logger = new Mailer(function (email) {
    email.logged = true;
    return email;
  });
  var mailer = Mailer.compose(sender, logger);

  test.equal(mailer.send({}), {
    sent: true
    , logged: true
  });
});

Tinytest.add('Mailer - Mailer.extend creates a new mailer with additional options', function (test) {
  var mailer = new Mailer(function (email) {
    return _.extend(email, this.options);
  });
  var extendedMailer = mailer.extend({
    name: 'test'
  });

  test.equal(extendedMailer.send({}), {
    name: 'test'
  });
});

Tinytest.add('Mailer - Mailer.Router.route creates a new mailer with the specified route name', function (test) {
  var router = new Mailer.Router();

  var mailer = router.route('test');

  test.equal(mailer.name, 'test');
  test.equal(router._routes, {
    test: mailer
  });
});

Tinytest.add('Mailer - Mailer.Router.send sends email via the named route', function (test) {
  var router = new Mailer.Router();

  var mailer = router.route('test', function (email) {
    email.sent = true;
    email.logged = this.options.logged;
    return email;
  }, {
    logged: true
  });

  test.equal(router.send('test', {}), {sent: true, logged: true});
});

Tinytest.add('Mailer - Mailer.Router.send accepts additional options', function (test) {
  var router = new Mailer.Router();

  var mailer = router.route('test', function (email) {
    email.sent = true;
    email.logged = this.options.logged;
    return email;
  });

  test.equal(router.send('test', {}, {logged: true}), {sent: true, logged: true});
});
