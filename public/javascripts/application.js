
// Create main namespace

HttpCron = SC.Application.create({
  store: SC.Store.create({commitRecordsAutomatically: true}).from('HttpCron.TaskDataSource')
});

HttpCron.TaskDataSource = SC.ResourceDataSource.extend({
  resourceName: 'api/tasks'
});

// Define model
HttpCron.Task = SC.Record.extend({
  primaryKey: 'id',

  name: SC.Record.attr(String),
  url: SC.Record.attr(String),
  cron: SC.Record.attr(String),
  enabled: SC.Record.attr(Boolean),
  created_at: SC.Record.attr(Number)
});

// Define controllers
HttpCron.TasksList = SC.ArrayProxy.create({
  content: [],
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

HttpCron.User = SC.Object.create({
  login: function() {
    var username = this.get('username'),
        password = this.get('password');
    $.httpDigest = new HTTPDigest(username, password);
    $.httpDigest.unauthorizedCode = 442;
    SC.Request.headUrl('/api/authenticate').json()
      .notify(this, '_didLogin')
      .send();
  },

  _didLogin: function(response) {
    if (SC.ok(response)) {
      HttpCron.LoginView.remove();
      HttpCron.TasksView.append();
      var query = HttpCron.store.find(SC.Query.local(HttpCron.Task));
      HttpCron.TasksList.set('content', query);
    } else {
      
    }
  }
});

HttpCron.LoginView = SC.ControlledView.create({
  templateName: 'login-view',
  controller: 'HttpCron.User',
  append: function() {
    this.appendTo('[role="main"]');
  }
});

HttpCron.TasksView = SC.ControlledView.create({
  templateName: 'tasks-view',
  append: function() {
    this.appendTo('[role="main"]');
  }
});

$(function() {
  HttpCron.LoginView.append();
});
