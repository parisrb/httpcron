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

  name: SC.Record.attr(String, {isRequired: true}),
  url: SC.Record.attr(String, {isRequired: true}),
  cron: SC.Record.attr(String, {isRequired: true, defaultValue: '0 22 * * 1-5'}),
  enabled: SC.Record.attr(Boolean, {isRequired: true, defaultValue: true}),
  created_at: SC.Record.attr(Number),
  timeout: SC.Record.attr(Number, {defaultValue: 60}),

  isEditing: false,
  isNotEditingBinding: SC.Binding.not('isEditing'),

  cleanUrl: function() {
    return this.get('url').replace(/^http:\/\//, '');
  }.property('url').cacheable(),

  nested: null,
  nestedContent: null,

  toggle: function() {
    this.toggleProperty('isEditing');
  },

  save: function() {
    this.toggle();
    this.get('nested').commitChanges();
    HttpCron.store.commitRecords();
  },

  cancel: function() {
    this.toggle();
    this.get('nested').discardChanges();
  },

  edit: function() {
    if (this.get('isEditing')) { return false; }
    var nested = this.get('nested');
    if (!nested) {
      var nested = HttpCron.store.chain();
      var task = nested.find(this);
      this.set('nestedContent', task);
      this.set('nested', nested);
    } else {
      this.get('nested').reset();
    }
    this.toggle();
  },

  logs: function() {
    HttpCron.ExecutionsView.append();
    HttpCron.ExecutionsList.fetch(this);
  }
});

// Define controllers
HttpCron.TasksList = SC.ArrayProxy.create({
  content: [],
  isErrorBinding: 'content.isError'
});

HttpCron.ExecutionsList = SC.ArrayProxy.create({
  content: [],
  isErrorBinding: 'content.isError',
  fetch: function(record) {
    var id = record.get('id');
    var title = record.get('name');
    this.set('title', title);
    this.set('content', []);
    SC.Request.getUrl('/api/tasks/executions/'+id).json()
      .notify(this, 'fetchDidComplete')
      .send();
  },
  fetchDidComplete: function(response) {
    if (SC.ok(response)) {
      this.set('content', response.get('body'))
    }
  }
});

HttpCron.NewTask = SC.Object.create({

  attributes: ['name', 'url', 'cron', 'enabled', 'timeout'],
  defaults: {
    cron: '0 22 * * 1-5',
    enabled: true,
    timeout: 60
  },

  isVisible: false,
  isInvisibleBinding: SC.Binding.not('isVisible'),

  toggle: function() {
    this.toggleProperty('isVisible');
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
    if (!this.get('isVisible')) {
      this.attributes.forEach(function(name) {
        this.set(name, this.defaults[name] || '');
      }, this);
    }
  }.observes('isVisible')
});

HttpCron.User = DigestAuthentication.User.create({
  storageName: 'httpcron.user',
  url: '/api/authenticate',

  didLoggedIn: function() {
    HttpCron.TasksView.append();
    var query = HttpCron.store.find(SC.Query.local(HttpCron.Task));
    HttpCron.TasksList.set('content', query);
  },

  didLoggedOut: function() {
    HttpCron.LoginView.append();
  },

  didLoggedInFail: function() {
    HttpCron.LoginView.append();
  }
});

HttpCron.PageView = SC.View.extend({
  append: function() {
    if (HttpCron.PageView.currentPage && HttpCron.PageView.currentPage.state === 'inDOM') {
      HttpCron.PageView.currentPage.remove();
    }
    if (this.state !== 'inDOM') {
      HttpCron.PageView.currentPage = this;
      this.appendTo('[role="main"]');
    }
  }
});

HttpCron.LoginView = HttpCron.PageView.create({
  classNames: 'login-page',
  templateName: 'login-page',
  contentBinding: 'HttpCron.User'
});

HttpCron.TasksView = HttpCron.PageView.create({
  templateName: 'tasks-page'
});

HttpCron.ExecutionsView = HttpCron.PageView.create({
  classNames: 'executions-page',
  templateName: 'executions-page',
  titleBinding: 'HttpCron.ExecutionsList.title'
});

HttpCron.LoginTextField = SC.TextField.extend({
  contentBinding: 'parentView.content',
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isLoggingIn'
});

HttpCron.TasksCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.TasksList',
  tagName: 'ul',
  classNames: ['tasks-list', 'list'],
  itemViewClass: SC.View.extend({
    doubleClick: function() {
      this.get('content').edit();
    },
    mouseEnter: function() {
      this.$('.show-task button').show();
    },
    mouseLeave: function() {
      this.$('.show-task button').hide();
    }
  })
});

HttpCron.ExecutionsCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.ExecutionsList',
  tagName: 'ul',
  classNames: ['executions-list', 'list']
});

$(function() {
  HttpCron.User.login();
});
