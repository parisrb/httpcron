
// Create main namespace

HttpCron = SC.Application.create({
  store: SC.Store.create({commitRecordsAutomatically: true}).from('HttpCron.TaskDataSource')
});

HttpCron.TaskDataSource = SC.ResourceDataSource.extend({
  resourceName: 'tasks'
});

// Define model
HttpCron.Task = SC.Record.extend({
  primaryKey: 'id',

  name: SC.Record.attr(String),
  url: SC.Record.attr(String),
  cron: SC.Record.attr(String),
  enabled: SC.Record.attr(Boolean)
});

// Define controllers
HttpCron.TasksList = SC.ArrayProxy.create({
  content: HttpCron.store.find(SC.Query.local(HttpCron.Task)),
  isErrorBinding: 'content.isError'
});

HttpCron.NewTask = SC.Object.create({

  attributes: ['name', 'url', 'cron'],
  defaults: {
    cron: '0 22 * * 1-5'
  },

  isVisibleBinding: 'view.isVisible',

  toggle: function() {
    this.get('view').toggleProperty('isVisible');
  },

  save: function() {
    var data = {};
    this.attributes.forEach(function(name) {
      data[name] = this.get(name);
    }, this);
    HttpCron.store.createRecord(HttpCron.Task, data);
    this.toggle();
  },

  reset: function() {
    if (!this.getPath('view.isVisible')) {
      this.attributes.forEach(function(name) {
        this.set(name, this.defaults[name] || '');
      }, this);
    }
  }.observes('view.isVisible')
});
