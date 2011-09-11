// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// current_user.js
// ==========================================================================
SB = this.SB || {};

SB.CurrentUser = SC.Object.extend({
  username: '',
  password: '',
  rememberMe: true,

  url: '/authenticate',
  authenticateMethod: 'HEAD',

  isLoggedIn: false,
  isLoggingIn: false,

  didLoggedIn: SC.K,
  didLoggedOut: SC.K,
  loginSuccess: SC.K,
  loginError: SC.K,

  setCredentials: SC.K,
  resetCredentials: SC.K,

  login: function() {
    if (this.get('isLoggedIn')) {return;}
    this.set('isLoggingIn', true);
    var username = this.get('username'),
        password = this.get('password');
    if (!SC.empty(username) && !SC.empty(password)) {
      this.setCredentials(username, password);
    }
    SC.$.ajax(this.get('url'), {
      type: this.get('authenticateMethod'),
      context: this,
      success: this._loginSuccess,
      error: this._loginError
    });
  },

  logout: function() {
    if (!this.get('isLoggedIn')) {return;}
    this.setProperties({'username': '', 'password': ''});
    this.resetCredentials();
    this.set('isLoggedIn', false);
    this.didLoggedOut();
  },

  /*
    @private
  */
  _loginSuccess: function(data) {
    this.set('isLoggingIn', false);
    this.set('isLoggedIn', true);
    this.loginSuccess(data);
    this.didLoggedIn();
    this.setProperties({'username': '', 'password': ''});
  },

  _loginError: function() {
    this.set('isLoggingIn', false);
    this.set('isLoggedIn', false);
    this.set('password', '');
    this.resetCredentials();
    this.loginError();
  }
});
