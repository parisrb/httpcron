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

  logs: function() {
    HC.ExecutionsPaneView.show();
    HC.ExecutionsList.fetch(this);
  }
});

