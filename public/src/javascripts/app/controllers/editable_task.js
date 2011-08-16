HttpCron.EditableTask = SC.Object.extend({
  isEditing: false,
  isNotEditingBinding: SC.Binding.not('isEditing'),
  record: null,
  nested: null,

  cleanUrl: function() {
    return this.get('url').replace(/^http:\/\//, '');
  }.property('url').cacheable(),

  toggle: function() {
    this.toggleProperty('isEditing');
  },

  logs: function() {
    HttpCron.ExecutionsView.append();
    HttpCron.ExecutionsList.fetch(this);
  },

  edit: function() {
    this._findRecord(this._editRecord);
  },

  save: function() {
    this.toggle();
    this.get('store').commitChanges();
    HttpCron.store.commitRecords();
    this._observeRecord(this.get('record'), SC.Record.READY_CLEAN, this._didSaveRecord);
  },

  cancel: function() {
    this.toggle();
    this.get('store').discardChanges();
  },

  destroy: function() {
    this._findRecord(this._destroyRecord);
  },

  _recordStatusName: function(status) {
    for (var key in SC.Record) {
      if (status === SC.Record[key]) {
        return key;
      }
    }
  },

  _observeRecord: function(record, status, callback) {
    record.addObserver('status', this, function observer() {
      if (record.get('status') === status) {
        record.removeObserver('status', this, observer);
        callback.call(this, record);
      }
    });
    record.notifyPropertyChange('status');
  },

  _findRecord: function(callback) {
    var record = this.get('record');
    if (!record) {
      record = HttpCron.store.find(HttpCron.Task, this.get('id'));
      this.set('record', record);
    }
    this._observeRecord(record, SC.Record.READY_CLEAN, callback);
  },

  _editRecord: function(record) {
    if (this.get('isEditing')) { return false; }
    var store = this.get('store');
    if (!store) {
      var store = HttpCron.store.chain();
      var task = store.find(record);
      this.set('nested', task);
      this.set('store', store);
    } else {
      this.get('store').reset();
    }
    this.toggle();
  },

  _destroyRecord: function(record) {
    record.destroy();
    this._observeRecord(record, SC.Record.DESTROYED_CLEAN, this._didDestroyRecord);
  },

  _didSaveRecord: function(record) {
    //console.log('update record');
    //this._updateFormRecord();
  },

  _didDestroyRecord: function(record) {
    HttpCron.TasksList.removeObject(this);
  }
});
