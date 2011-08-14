
/* 
 *  @class
 *  SC.View
 */

SC.View.reopen({
  toggleMethod: 'toggle',

  _isVisibleDidChange: function() {
    var method = this.$()[this.get('toggleMethod')];
    if (!method) { method = 'toggle'; }
    method.call(this.$(), this.get('isVisible'));
  }.observes('isVisible'),

  show: function() {
    this.set('isVisible', true);
  },
  hide: function() {
    this.set('isVisible', false);
  }
});

DigestAuthentication.registerInterface();

DigestAuthentication.User = SC.Object.extend({
  username: '',
  password: '',
  rememberMe: true,

  url: '/authenticate',
  authenticateMethod: 'HEAD',

  didLoggedIn: SC.K,
  didLoggedOut: SC.K,
  loginDidFail: SC.K,

  login: function() {
    this.set('isLoggingIn', true);
    var username = this.get('username'),
        password = this.get('password');
    if (!SC.empty(username) && !SC.empty(password)) {
      DigestAuthentication.persistent = this.get('rememberMe');
      DigestAuthentication.registerCredentials(username, password);
    }
    var method = "%@Url".fmt(this.get('authenticateMethod').toLowerCase());
    SC.Request[method](this.get('url')).json()
      .notify(this, '_didLoggedIn')
      .send();
  },

  logout: function() {
    this.setProperties({'username': '', 'password': ''});
    DigestAuthentication.reset();
    this.set('isLoggedIn', false);
    this.didLoggedOut();
  },

  /*
    @private
  */
  _didLoggedIn: function(response) {
    this.set('isLoggingIn', false);
    if (SC.ok(response)) {
      this.set('isLoggedIn', true);
      this.didLoggedIn(response);
      this.setProperties({'username': '', 'password': ''});
    } else {
      this.set('isLoggedIn', false);
      this.set('password', '');
      DigestAuthentication.reset();
      this.loginDidFail();
    }
  }
});
