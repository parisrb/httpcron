HC.ExecutionsList = SB.PaginatedArray.create({
  limit: 50,
  fetch: function(task) {
    this.set('task', task);
    this.reset(true);
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
    SC.$.ajax(url, {
      dataType: 'json',
      context: this,
      success: this._fetchSuccess,
      error: this._fetchError
    });
  },
  _fetchSuccess: function(data) {
    this.rangeDidLoaded(data.total, data.records);
  },
  _fetchError: function() {
    this.rangeDidLoaded(0, []);
  }
});
