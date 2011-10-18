HC.RecordController = SC.Object.extend({

  isErrorBinding: '*editedObject.isError',

  editedObject: null,

  isVisible: false,
  isInvisibleBinding: SC.Binding.not('isVisible'),
  isCommiting: false,

  record: null,

  toggle: function() {
    if (this.toggleProperty('isVisible')) {
      this.set('editedObject', this.get('record').create());
    }
  },

  save: function() {
    if (this.get('isCommiting')) { return; }
    this.set('isCommiting', true);
    SC.$.ajax(this.getPath('record.resourceUrl'), {
      type: 'POST',
      data: this.get('editedObject').toJSON(),
      dataType: 'json',
      context: this,
      success: this._createSuccess,
      error: this._createError
    });
  },

  _createSuccess: function(data) {
    var record = this.get('editedObject');
    record.setProperties(data);
    this.getPath('record.resourceList').unshiftObject(record);
    this.toggle();
    this.set('isCommiting', false);
    this.set('isError', false);
  },

  _createError: function(xhr) {
    this.set('isCommiting', false);
    this.set('isError', true);
    this.set('errorMessage', xhr.responseText);
  }
});

HC.NewTask = HC.RecordController.create({

  nameBinding: '*editedObject.name',
  cronBinding: '*editedObject.cron',
  urlBinding: '*editedObject.formattedUrl',
  enabledBinding: '*editedObject.enabled',

  recordBinding: 'HC.Task'
});

HC.NewUser = HC.RecordController.create({

  usernameBinding: '*editedObject.username',
  passwordBinding: '*editedObject.password',
  adminBinding: '*editedObject.admin',
  email_address: '*editedObject.email_address',

  recordBinding: 'HC.User'
});
