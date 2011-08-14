
DigestAuthentication.registerInterface();

DigestAuthentication.User = SC.Object.extend({
  storageName: 'user',
  storageClass: SC.LocalStorage,
  username: '',
  password: '',
  url: '/authenticate',
  authenticateMethod: 'HEAD',
  loginMethods: ['Chalange', 'Password'],

  didLoggedIn: SC.K,
  didLoggedOut: SC.K,
  didLoggedInFail: SC.K,

  init: function() {
    var storage = this.get('storageClass').create({
      storageName: this.get('storageName')
    });
    this.set('storage', storage);
  },

  login: function() {
    var methods = this.get('loginMethods'),
        digestOK = false;
    for (var name, l = methods.length, i = 0; i < l; i++) {
      name = '_loginFrom'+methods[i];
      if (this[name]) { digestOK = this[name].call(this); }
      if (digestOK) { break; }
    }
    if (digestOK) {
      this.set('isLoggingIn', true);
      var method = "%@Url".fmt(this.get('authenticateMethod').toLowerCase());
      SC.Request[method](this.get('url')).json()
        .notify(this, '_didLoggedIn')
        .send();
    } else {
      this.didLoggedInFail();
    }
  },

  logout: function() {
    this._resetCredentials();
    this._resetDigest();
    this.set('isLoggedIn', false);
    this.didLoggedOut();
  },

  /*
    @private
  */
  _loginFromChalange: function() {
    var storage = this.get('storage'),
        username = storage.get('username'),
        ha1 = storage.get('ha1');
    if (!SC.empty(username) && !SC.empty(ha1)) {
      this._buildDigest(username, null, ha1);
      return true;
    }
    return false;
  },

  /*
    @private
  */
  _loginFromPassword: function() {
    var username = this.get('username'),
        password = this.get('password');
    if (!SC.empty(username) && !SC.empty(password)) {
      this._buildDigest(username, password);
      return true;
    }
    return false;
  },

  /*
    @private
  */
  _resetCredentials: function() {
    this.set('username', '');
    this.set('password', '');
  },

  /*
    @private
  */
  _buildDigest: function(username, password, ha1) {
    DigestAuthentication.registerCredentials(username, password);
    if (ha1) {
      DigestAuthentication.registerHA1(ha1);
    }
  },

  /*
    @private
  */
  _saveDigest: function(username, ha1) {
    this.setPath('storage.username', username);
    this.setPath('storage.ha1', ha1);
  },

  /*
    @private
  */
  _resetDigest: function() {
    this._saveDigest(null, null);
    DigestAuthentication.reset();
  },

  /*
    @private
  */
  _didLoggedIn: function(response) {
    this.set('isLoggingIn', false);
    if (SC.ok(response)) {
      this.set('isLoggedIn', true);
      var credentials = DigestAuthentication.getCredentials();
      this._saveDigest(credentials.username, credentials.ha1);
      this.didLoggedIn(response);
      this._resetCredentials();
    } else {
      this.set('isLoggedIn', false);
      this.set('password', '');
    }
  }
});
