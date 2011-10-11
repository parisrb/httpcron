
HttpCron.Model = SC.Object.extend({

  // Attributes
  resourceUrl: '',
  resourceList: null,

  toJSON: function() {},

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
    SC.$.ajax('%@/%@'.fmt(this.get('resourceUrl'), this.get('id')), {
      type: 'PUT',
      dataType: 'json',
      data: this.toJSON(),
      context: this,
      success: this._updateSuccess,
      error: this._updateError
    });
  },

  // Destroy
  destroy: function() {
    if (this.get('isCommiting')) { return; }
    this.set('isCommiting', true);
    SC.$.ajax('%@/%@'.fmt(this.get('resourceUrl'), this.get('id')), {
      type: 'DELETE',
      dataType: 'json',
      context: this,
      success: this._destroySuccess,
      error: this._destroyError
    });
  },

  _updateSuccess: function(data) {
    this.setProperties(data);
    this.set('isCommiting', false);
    this.set('isError', false);
    this.toggle();
  },

  _updateError: function(xhr) {
    this.set('isCommiting', false);
    this.set('isError', true);
    this.set('errorMessage', xhr.responseText);
  },

  _destroySuccess: function() {
    this.get('resourceList').removeObject(this);
    this.set('isCommiting', false);
    this.set('isError', false);
  },

  _destroyError: function(xhr) {
    this.set('isCommiting', false);
    this.set('isError', true);
    this.set('errorMessage', xhr.responseText);
    console.log(xhr);
  }
});

