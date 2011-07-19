// Create main namespace

HttpCron = SC.Application.create({
  store: SC.Store.create().from('HttpCron.DataSource')
});

// Define data source
HttpCron.DataSource = SC.DataSource.extend({
  fetch: function(store, query) {
  }
});

// Define model
HttpCron.Task = SC.Record.extend({
  name: SC.Record.attr(String),
  url: SC.Record.attr(String)
});

// Define controllers
HttpCron.TasksList = SC.ArrayProxy.create({
  content: HttpCron.store.find(SC.Query.local(HttpCron.Task))
});

// Define mixins
SC.ControllerSupport = SC.Mixin.create({

  controller: null,

  _addController: function() {
    var controller = this.get('controller');

    if (SC.typeOf(controller) === "string") {
      controller = SC.getPath(controller);
      this.set('controller', controller); 
    }

    controller.set('view', this);
  },

  init: function() {
    this._super();
    this._addController();
  }
});

SC.ControlledView = SC.View.extend(SC.ControllerSupport, {});

HttpCron.NewTask = SC.Object.create({
  content: {},
  view: null,

  toggle: function() {
    this.get('view').toggle();
  },

  save: function() {
    HttpCron.store.createRecord(HttpCron.Task, {
      name: this.getPath('name'),
      url: this.getPath('url')
    });
    this.setPath('name', '');
    this.setPath('url', '');
    this.toggle();
  }
});

// Define views
HttpCron.TasksCollection = SC.CollectionView.extend({
  tagName: 'ul',
  contentBinding: 'HttpCron.TasksList'
});

HttpCron.NewTaskView = SC.ControlledView.extend({
  isVisible: false,
  controller: 'HttpCron.NewTask',

  toggle: function() {
    this.toggleProperty('isVisible');
  }
});
