// ===============================================================================
// Project    :   HttpCron
// Copyright  :   ©2011 Paris.rb
// Authors    :   Julien Kirch [archiloque], Paul Chavard [tchak], Vincent Viaud
//
// ===============================================================================

HttpCron.NewTask = SC.Object.create({

  nameBinding: '*editedObject.name',
  cronBinding: '*editedObject.cron',
  urlBinding: '*editedObject.formattedUrl',
  enabledBinding: '*editedObject.enabled',

  editedObject: null,

  isVisible: false,
  isInvisibleBinding: SC.Binding.not('isVisible'),
  isCommiting: false,

  toggle: function() {
    if (this.toggleProperty('isVisible')) {
      this.set('editedObject', HttpCron.Task.create());
    }
  },

  save: function() {
    if (this.get('isCommiting')) { return; }
    this.set('isCommiting', true);
    SC.$.ajax('/api/tasks', {
      type: 'POST',
      data: this.get('editedObject').toJSON(),
      dataType: 'json',
      context: this,
      success: this._createTaskSuccess,
      error: this._createTaskError
    });
  },

  _createTaskSuccess: function(data) {
    var task = this.get('editedObject');
    task.setProperties(data);
    HttpCron.TasksList.unshiftObject(task);
    this.toggle();
    this.set('isCommiting', false);
  },

  _createTaskError: function() {
    this.set('isCommiting', false);
  }
});
