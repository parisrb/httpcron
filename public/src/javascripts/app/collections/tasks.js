
HttpCron.TasksList = SB.PaginatedArray.create({
  isLoading: true,
  limit: 10,
  fetch: function() {
    this.reset();
  },
  didRequireRange: function(limit, offset) {
    this._super();
    this.set('content', []);
    var url = "/api/tasks?limit=%@&offset=%@".fmt(limit, offset);
    SC.Request.getUrl(url).json()
      .notify(this, 'rangeDidLoaded')
      .send();
  },
  rangeDidLoaded: function(response) {
    if (SC.ok(response)) {
      var data = response.get('body');
      var tasks = data.records.map(function(task) {
        return HttpCron.EditableTask.create(task);
      }, this);
      this._super(data.total, tasks);
    } else {
      this._super(0, []);
    }
  }
});
