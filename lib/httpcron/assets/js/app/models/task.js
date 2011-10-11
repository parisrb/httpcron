//= require ./model

HttpCron.Task = HttpCron.Model.extend({
  resourceUrl: '/api/tasks',
  resourceListBinding: 'HttpCron.TasksList',

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
    HttpCron.ExecutionsPaneView.show();
    HttpCron.ExecutionsList.fetch(this);
  }
});

