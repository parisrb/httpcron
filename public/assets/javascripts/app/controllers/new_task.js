
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
    this.toggle();
    HttpCron.store.createRecord(HttpCron.Task, data);
    HttpCron.TasksList.reload();
  },

  reset: function() {
    if (!this.get('isVisible')) {
      this.attributes.forEach(function(name) {
        this.set(name, this.defaults[name] || '');
      }, this);
    }
  }.observes('isVisible')
});
