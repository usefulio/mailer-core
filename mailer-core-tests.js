Tinytest.add('Mailer Core - accepts an action function and options', function (test) {
  var mailer = new Mailer(function (email) {
    return true;
  }, {
    option: 'one'
  });
  test.equal(typeof mailer.action, 'function');
  test.equal(mailer.options, {option: 'one'});
});

Tinytest.add('Mailer Core - accepts multiple options arguments', function (test) {
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

Tinytest.add('Mailer Core - calls action when sending', function (test) {
  var mailer = new Mailer(function (email) {
    return _.extend(email, this.options);
  }, {
    option: 'one'
  });
  test.equal(mailer.send({from: 'one'}), {from: 'one', option: 'one'});
});

Tinytest.add('Mailer Core - mailer.send returns the processed email unless the action returns false', function (test) {
  var mailer = new Mailer(function (email) {
    if (this.options.reject)
      return false;
    if (this.options.replace)
      return {
        replacement: true
      };

    return email;
  });

  test.equal(mailer.send({}), {});
  test.equal(mailer.send({}, {replace: true}), {replacement: true});
  test.equal(mailer.send({}, {reject: true}), null);
});

Tinytest.add('Mailer Core - passes additional options to action when sending', function (test) {
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

Tinytest.add('Mailer Core - Mailer.compose runs multiple actions in a chain', function (test) {
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

Tinytest.add('Mailer Core - Mailer.compose accepts a function as the options object for an action', function (test) {
  var sender = new Mailer(function (email) {
    email.sent = true;
    return email;
  });
  var custom = {
    action: function (email) {
      email.name = this.options.name;
      return email;
    }
    , options: function (options) {
      return options.custom;
    }
  };
  var mailer = Mailer.compose(sender, custom);

  test.equal(mailer.send({}, {custom: {name: 'test'}}), {
    sent: true
    , name: 'test'
  });
});

Tinytest.add('Mailer Core - Mailer.extend creates a new mailer with additional options', function (test) {
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

Tinytest.add('Mailer Core - Mailer.Router.route creates a new mailer with the specified route name', function (test) {
  var router = new Mailer.Router();

  var mailer = router.route('test', function (email) {});

  test.equal(mailer.name, 'test');
  test.equal(router._routes, {
    test: mailer
  });
});

Tinytest.add('Mailer Core - Mailer.Router.route accepts multiple actions and named routes', function (test) {
  var router = new Mailer.Router();
  router.route('before', function (email) {
    email.log += 'before';
    return email;
  });
  router.route('after', function (email) {
    email.log += 'after';
    return email;
  });
  router.route('test'
    , function (email) {email.log = ''; return email;}
    , 'before'
    , function (email) {email.log += '1'; return email;}
    , 'after'
  );

  test.equal(router.send('test', {}), {log: 'before1after'});
});

Tinytest.add('Mailer Core - Mailer.Router.route with multiple actions passes options to first anonymous action', function (test) {
  var router = new Mailer.Router();
  router.route('before', function (email) { return email; });
  router.route('after', function (email) { return email; });
  router.route('test'
    , function (email) {email.log = this.options.log; return email;}
    , 'before'
    , function (email) {return email;}
    , 'after'
  );

  test.equal(router.send('test', {}, {log: 'test'}), {log: 'test'});
});

Tinytest.add('Mailer Core - Mailer.Router.route lazily resolves named actions', function (test) {
  var router = new Mailer.Router();
  router.route('test'
    , function (email) {email.log = this.options.log; return email;}
    , 'before'
    , function (email) {return email;}
    , 'after'
  );
  router.route('before', function (email) { return email; });
  router.route('after', function (email) { return email; });

  test.equal(router.send('test', {}, {log: 'test'}), {log: 'test'});
});

Tinytest.add('Mailer Core - Mailer.Router.route accepts functions as options for routes', function (test) {
  var router = new Mailer.Router();
  router.route('test'
    , [function (email) {email.log = this.options.log;}, function (options) {return options;}]
    , ['before', function (options) {return  options.before;}]
    , function (email) {return email;}
    , {
        'after': function (options) {
          return options.after;
        }
      }
  );
  router.route('before', function (email) { email.before = this.options.name; });
  router.route('after', function (email) { email.after = this.options.name; });

  test.equal(router.send('test', {}, {
    log: 'test'
    , before: {
      name: 'before'
    }
    , after: {
      name: 'after'
    }
  }), {log: 'test', before: 'before', after: 'after'});
});

Tinytest.add('Mailer Core - Mailer.Router.send sends email via the named route', function (test) {
  var router = new Mailer.Router();

  var mailer = router.route('test', [function (email) {
    email.sent = true;
    email.logged = this.options.logged;
    return email;
  }, {
    logged: true
  }]);

  test.equal(router.send('test', {}), {sent: true, logged: true});
});

Tinytest.add('Mailer Core - Mailer.Router.send accepts additional options', function (test) {
  var router = new Mailer.Router();

  var mailer = router.route('test', function (email) {
    email.sent = true;
    email.logged = this.options.logged;
    return email;
  });

  test.equal(router.send('test', {}, {logged: true}), {sent: true, logged: true});
});
