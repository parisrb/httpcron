
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
