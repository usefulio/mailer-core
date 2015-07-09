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