HC.Task = HC.Record.extend({

  resourceUrl: '/api/tasks',
  resourceListBinding: 'HC.TasksList',

  // Attributes
  name: '',
  url: '',
  cron: '0 22 * * 1-5',
  enabled: true,
  timeout: 60,

  toJSON: function() {
    return {
      name: this.get('name'),
      url: this.get('url'),
      cron: this.get('cron'),
      enabled: this.get('enabled'),
      timeout: this.get('timeout')
    };
  },

  formattedUrl: function(key, value) {
    if (SC.typeOf(value) === 'string') {
      if (!value.match(/^http:\/\//)) {
        value = 'http://' + value;
      }
      this.set('url', value);
    }
    return this.get('url').replace(/^http:\/\//, '');
  }.property('url').cacheable(),

  formattedNextExecution: function() {
    return this._toFormattedString('next_execution');
  }.property('next_execution').cacheable(),

  formattedCreatedAt: function() {
    return this._toFormattedString('created_at');
  }.property('created_at').cacheable(),

  formattedUpdatedAt: function() {
    return this._toFormattedString('updated_at');
  }.property('updated_at').cacheable(),

  _toFormattedString: function(propertyName) {
    var text = this.get(propertyName);
    if (SC.empty(text)) { return 'none'; }
    var date = SC.DateTime.parse(text);
    return date ? date.toFormattedString('%d/%m/%Y %H:%M') : '';
  },

  logs: function() {
    HC.ExecutionsPaneView.show();
    HC.ExecutionsList.fetch(this);
  }
});

