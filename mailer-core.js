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
  this.options = _.extend.apply(_, [{}].concat(options));
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
    _.each(mailer.mailers, function (mailer) {
      email = mailer.send(email);
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
  var options = _.extend.apply(_, [{}].concat([this.options]).concat(_.toArray(arguments).slice(1)));
  
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
