
// SC.ControllerSupport

SC.ControllerSupport = SC.Mixin.create({

  controller: null,

  _addController: function() {
    var controller = this.get('controller');

    if (SC.typeOf(controller) === "string") {
      controller = SC.getPath(controller);
      this.set('controller', controller); 
    }
    if (controller && controller.isObserverable) {
      controller.set('view', this);
    }
  },

  init: function() {
    this._super();
    this._addController();
  }
});

// SC.ControlledView

SC.ControlledView = SC.View.extend(SC.ControllerSupport, {});

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
      .notify(this, '_didFetchTasks', store, query)
      .send();
    return true;
  },

  _didFetchTasks: function(response, store, query) {
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
    return this._createOrUpdateRecord(store, storeKey);
  },

  _createOrUpdateRecord: function(store, storeKey) {
    var url = this.resourceURL(store, storeKey);
    SC.Request.postUrl(url).json()
      .notify(this, '_didCreateOrUpdateTask', store, storeKey)
      .send(store.readDataHash(storeKey));
    return true;
  },

  _didCreateOrUpdateTask: function(response, store, storeKey) {
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
      .notify(this, '_didDestroyTask', store, storeKey)
      .send();
    return true;
  },

  _didDestroyTask: function(response, store, storeKey) {
    if (SC.ok(response)) {
      store.dataSourceDidDestroy(storeKey);
    } else {
      store.dataSourceDidError(storeKey, response);
    }
  }
});