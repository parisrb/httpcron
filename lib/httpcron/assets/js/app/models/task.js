HttpCron.Task = SC.Object.extend({

  // Attributes
  name: '',
  url: '',
  cron: '0 22 * * 1-5',
  enabled: true,
  timeout: 60,

  formattedUrl: function(key, value) {
    if (SC.typeOf(value) === 'string') {
      if (!value.match(/^http:\/\//)) {
        value = 'http://' + value;
      }
      this.set('url', value);
    }
    return this.get('url').replace(/^http:\/\//, '');
  }.property('url').cacheable(),

  toJSON: function() {
    return {
      name: this.get('name'),
      url: this.get('url'),
      cron: this.get('cron'),
      enabled: this.get('enabled'),
      timeout: this.get('timeout')
    };
  },

  // Editing
  isEditing: false,
  isNotEditingBinding: SC.Binding.not('isEditing'),
  isCommiting: false,
  isError: false,

  // Actions
  toggle: function() {
    if (this.toggleProperty('isEditing')) {
      this._undo = this.toJSON();
    }
  },

  logs: function() {
    HttpCron.ExecutionsPaneView.show();
    HttpCron.ExecutionsList.fetch(this);
  },

  edit: function() {
    this.toggle();
  },

  cancel: function() {
    this.set('isError', false);
    this.setProperties(this._undo);
    this.toggle();
  },

  // Update
  update: function() {
    if (this.get('isCommiting')) { return; }
    this.set('isCommiting', true);
    SC.$.ajax('/api/tasks/%@'.fmt(this.get('id')), {
      type: 'PUT',
      dataType: 'json',
      data: this.toJSON(),
      context: this,
      success: this._updateTaskSuccess,
      error: this._updateTaskError
    });
  },

  // Destroy
  destroy: function() {
    if (this.get('isCommiting')) { return; }
    this.set('isCommiting', true);
    SC.$.ajax('/api/tasks/%@'.fmt(this.get('id')), {
      type: 'DELETE',
      dataType: 'json',
      context: this,
      success: this._destroyTaskSuccess,
      error: this._destroyTaskError
    });
  },

  _updateTaskSuccess: function(data) {
    this.setProperties(data);
    this.set('isCommiting', false);
    this.set('isError', false);
    this.toggle();
  },

  _updateTaskError: function(xhr) {
    this.set('isCommiting', false);
    this.set('isError', true);
    this.set('errorMessage', xhr.responseText);
  },

  _destroyTaskSuccess: function() {
    HttpCron.TasksList.removeObject(this);
    this.set('isCommiting', false);
    this.set('isError', false);
  },

  _destroyTaskError: function(xhr) {
    this.set('isCommiting', false);
    this.set('isError', true);
    this.set('errorMessage', xhr.responseText);
    console.log(xhr);
  }
});

