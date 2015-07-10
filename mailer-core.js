/**
 * Creates a mailer instance, mailer instances perform a certain action related to sending email
 * 
 * @constructor
 * @self mailer
 * @type Mailer
 * @param {function} action A function to call when sending the email.
 *   Will be called with a single argument, 'email', with the this context set to this mailer
 *   ```
 *   function (email) {
 *     email.domain = this.options.domain;
 *     return email;
 *   }
 *   ```
 *   This function should return the email object, after mutating it, or should return false to indicate that sending of the email should be cancelled
 *   ```
 *   function (email) {
 *     if (user.preferences.email === false)
 *       return false;
 *     else
 *       return email
 *   }
 *   ```
 * @param {object...} options An object or objects which define the options for this mailer, options are accessible from within the action function, and are attached to the mailer instance for easy inspection or modification.
 */

Mailer = function (action) {
  options = _.toArray(arguments).slice(1);
  this.action = action;
  this.options = options.length === 1 ? options[0] : _.extend.apply(_, [{}].concat(options));

  return this;
};

/**
 * Composes multiple mailer instances into one which performs all of the actions of each mailer instance
 *
 * @method Mailer.compose
 * @param {mailer|array|object...} mailers The mailers to compose into one
 *
 * @returns {mailer} A mailer which runs all the specified actions when sending
 */

Mailer.compose = function () {
  var mailers = _.flatten(_.toArray(arguments));
  var mailer = new Mailer(function (email) {
    var self = this;
    _.each(mailer.mailers, function (mailer) {
      if (_.isFunction(mailer.options)) {
        var options = mailer.options(self.options);
        email = mailer.send(email, options);
      } else {
        email = mailer.send(email);
      }
    });
    return email;
  });
  mailer.mailers = _.map(mailers, function (mailer) {
    if (!(mailer instanceof Mailer))
      mailer = new Mailer(mailer.action, mailer.options);
    return mailer;
  });
  return mailer;
};

Mailer.Router = function () {
  this._routes = {};
};

/**
 * Creates a route with the specified name so that you can call Mailer.set(name, email)
 *
 * @method  Mailer.Router.prototype.route
 * @param {string} routeName The name of the route
 * @param {function} action The route action, see the docs for new Mailer
 * @param {object...} options The options for this route, see the docs for new Mailer
 *
 * @returns {mailer} The route which was created
 */

Mailer.Router.prototype.route = function (routeName) {
  var mailerDefinitions = _.toArray(arguments).slice(1);
  var firstMailer;
  var self = this;

  var mailers = _.flatten(_.map(mailerDefinitions, function (definition) {
    if (_.isFunction(definition)) {
      return new Mailer(definition, function (options) {return options;});
    }
    if (_.isArray(definition)) {
      var action = definition[0];
      if (_.isString(action))
        definition[0] = function (email) {
          return self.send(action, email, this.options);
        };
      return Mailer.apply(new Mailer(), definition);
    }
    if (_.isObject(definition)) {
      return _.map(definition, function (options, routeName) {
        return new Mailer(function (email) {
          return self.send(routeName, email, this.options);
        }, options);
      });
    }
    if (_.isString(definition)) {
      return new Mailer(function (email) {
        return self.send(definition, email, this.options);
      });
    }
  }));

  var route = Mailer.compose(mailers);

  route.name = routeName;
  this._routes[routeName] = route;

  return route;
};

/**
 * Sends an email using the specified route
 *
 * @method  Mailer.Router.prototype.send
 * @param {string} routeName The name of the route to use
 * @param {object} email The email to send
 * @param {object...} options The options to use when sending the email
 */

Mailer.Router.prototype.send = function (routeName) {
  var sendParams = _.toArray(arguments).slice(1);
  var mailer = this._routes[routeName];

  return mailer.send.apply(mailer, sendParams);
};

/**
 * Sends an email by passing it to mailer.action
 *
 * @method Mailer.prototype.send
 * @param {object} email The email to send
 * @param {object...} options An object (or objects) with additional options.
 *                            The additional options will be mixed into mailer.options and available to the mailer.action function.
 * @returns {object} The email which was sent.
 */

Mailer.prototype.send = function(email) {
  var optionParams = _.filter(
    [{}].
    concat([this.options]).
    concat(_.toArray(arguments).slice(1))
    , function (option) {
      return _.isObject(option) && !_.isFunction(option);
    }
  );
  var options = _.extend.apply(_, optionParams);
  
  return this.action.call({
    options: options
  }, email);
};

/**
 * Creates a clone of this mailer, extending it with the additional options specified
 *
 * @method  Mailer.prototype.extend
 * @param {object...} options The options used to extend the current mailer
 *
 * @returns {mailer} The mailer with the extended options set
 */

Mailer.prototype.extend = function () {
  var options = _.extend.apply(_, [{}, this.options].concat(_.toArray(arguments)));

  return new Mailer(this.action, options);
};
