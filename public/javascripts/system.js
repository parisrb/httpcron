
// SC.View

SC.View.reopen({
  toggleMethod: 'toggle',

  _isVisibleDidChange: function() {
    var method = this.$()[this.get('toggleMethod')];
    if (!method) { method = 'toggle'; }
    method.call(this.$(), this.get('isVisible'));
  }.observes('isVisible')
});

// SC.ResourceDataSource

SC.ResourceDataSource = SC.DataSource.extend({

  resourceName: null,

  resourceURL: function(store, storeKey) {
    var id, resourceName = this.get('resourceName');
    if (!resourceName) {
      throw SC.Error.create("You have to define resourceName...");
    }
    if (storeKey) {
      id = store.idFor(storeKey); 
    }
    if (id) {
      return '/%@/%@'.fmt(resourceName, id);
    }
    return '/%@'.fmt(resourceName);
  },

  // fetch

  fetch: function(store, query) {
    var url = this.resourceURL(store);
    SC.Request.getUrl(url).json()
      .notify(this, 'fetchDidComplete', store, query)
      .send();
    return true;
  },

  fetchDidComplete: function(response, store, query) {
    if (SC.ok(response)) {
      var records = response.get('body');
      if (records.length > 0) {
        store.loadRecords(query.get('recordType'), records);
        store.dataSourceDidFetchQuery(query);
      }
    } else {
      store.dataSourceDidErrorQuery(query, response);
    }
  },

  // create / update

  createRecord: function(store, storeKey) {
    return this._createOrUpdateRecord(store, storeKey);
  },

  updateRecord: function(store, storeKey) {
    return this._createOrUpdateRecord(store, storeKey, true);
  },

  _createOrUpdateRecord: function(store, storeKey, update) {
    var url = this.resourceURL(store, storeKey);
    SC.Request[update ? 'putUrl' : 'postUrl'](url).json()
      .notify(this, 'createOrUpdateRecordDidComplete', store, storeKey)
      .send(store.readDataHash(storeKey));
    return true;
  },

  createOrUpdateRecordDidComplete: function(response, store, storeKey) {
    if (SC.ok(response)) {
      var data = response.get('body');
      if (store.idFor(storeKey)) {
        store.dataSourceDidComplete(storeKey, data);
      } else {
        store.dataSourceDidComplete(storeKey, null, data.id);
      }
    } else {
      store.dataSourceDidError(storeKey, response);
    }
  },

  // destroy

  destroyRecord: function(store, storeKey) {
    var url = this.resourceURL(store, storeKey);
    SC.Request.deleteUrl(url).json()
      .notify(this, 'destroyRecordsDidComplete', store, storeKey)
      .send();
    return true;
  },

  destroyRecordsDidComplete: function(response, store, storeKey) {
    if (SC.ok(response)) {
      store.dataSourceDidDestroy(storeKey);
    } else {
      store.dataSourceDidError(storeKey, response);
    }
  }
});


SC.LocalStorage = SC.Object.extend({

  storagePrefix: 'sproutcore.local.storage.',

  storageName: 'default',

  storageKey: function(data) {
    return this.get('storagePrefix')+this.get('storageName');
  }.property('storagePrefix', 'storageName').cacheable(),

  init: function() {
    this._super();
    var data = this.get('data');
    for (var key in data) {
      this.set(key, data[key]);
    }
  },

  setUnknownProperty: function(keyName, value) {
    this.addObserver(keyName, this, this.contentPropertyDidChange);
    this.set(keyName, value);
  },

  contentPropertyDidChange: function(target, keyName, value) {
    var data = this.get('data');
    data[keyName] = value;
    this.set('data', data);
  },

  removeData: function(key) {
    if (key === undefined) {
      var storageKey = this.get('storageKey');
      localStorage.removeItem(storageKey);
    } else {
      var data = this.get('data');
      delete data[key];
      this.set('data', data);
    }
  },

  data: function(key, value) {
    var storageKey = this.get('storageKey');
    if (value !== undefined) {
      localStorage.setItem(storageKey, JSON.stringify(value));
      return value;
    } else {
      var data = localStorage.getItem(storageKey);
      if (data) {
        return JSON.parse(data);
      } else {
        return {};
      }
    }
  }.property()

});

// HTTPDigest.User

HTTPDigest.User = SC.Object.extend({
  storageName: 'user',
  storageClass: SC.LocalStorage,
  username: '',
  password: '',
  url: '/authenticate',
  loginMethods: ['challenge', 'password'],

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
      name = '_loginFrom_'+methods[i];
      if (this[name]) { digestOK = this[name].call(this); }
      if (digestOK) { break; }
    }
    if (digestOK) {
      $.httpDigest.unauthorizedCode = 442;
      this.set('isLoggingIn', true);
      SC.Request.headUrl(this.get('url')).json()
        .notify(this, '_didLoggedIn')
        .send();
    } else {
      this.didLoggedInFail();
    }
  },

  logout: function() {
    $.httpDigest = null;
    this._resetCredentials();
    this._resetDigest();
    this.set('isLoggedIn', false);
    this.didLoggedOut();
  },

  /*
    @private
  */
  _loginFrom_challenge: function() {
    var storage = this.get('storage'),
        username = storage.get('username'),
        ha1 = storage.get('ha1');
    if (!SC.empty(username) && !SC.empty(ha1)) {
      $.httpDigest = new HTTPDigest(username, null, ha1);
      return true;
    }
    return false;
  },

  /*
    @private
  */
  _loginFrom_password: function() {
    var username = this.get('username'),
        password = this.get('password');
    if (!SC.empty(username) && !SC.empty(password)) {
      $.httpDigest = new HTTPDigest(username, password);
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
  _saveDigest: function(username, ha1, realm) {
    this.setPath('storage.username', username);
    this.setPath('storage.ha1', ha1);
    this.setPath('storage.realm', realm);
  },

  /*
    @private
  */
  _resetDigest: function() {
    this._saveDigest(null, null);
  },

  /*
    @private
  */
  _didLoggedIn: function(response) {
    this.set('isLoggingIn', false);
    if (SC.ok(response)) {
      this.set('isLoggedIn', true);
      this._saveDigest($.httpDigest.username, $.httpDigest.ha1(), $.httpDigest.digest.realm);
      this.didLoggedIn();
      this._resetCredentials();
    } else {
      this.set('isLoggedIn', false);
      this.set('password', '');
    }
  }
});

