
HttpCron.ExecutionsList = ST.PaginatedArray.create({
  fetch: function(task) {
    this.set('task', task);
    this.reset();
  },
  didRequireRange: function(limit, offset) {
    var record = this.get('task');
    if (!record) {
      return;
    }
    this._super();
    var id = record.get('id');
    var title = record.get('name');
    this.set('title', title);
    var url = "/api/executions/task/%@?limit=%@&offset=%@".fmt(id, limit, offset);
    SC.Request.getUrl(url).json()
      .notify(this, 'rangeDidLoaded')
      .send();
  },
  rangeDidLoaded: function(response) {
    if (SC.ok(response)) {
      var data = response.get('body');
      this._super(data.total, data.records);
    } else {
      this._super(0, []);
    }
  }
});
