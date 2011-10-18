HC.TasksList = SB.PaginatedArray.create({
  isLoading: true,
  limit: 50,
  fetch: function() {
    this.reset(true);
  },
  didRequireRange: function(limit, offset) {
    this._super();
    this.set('content', []);
    var url = '/api/tasks?limit=%@&offset=%@'.fmt(limit, offset);
    SC.$.ajax(url, {
      dataType: 'json',
      context: this,
      success: this._fetchSuccess,
      error: this._fetchError
    });
  },
  _fetchSuccess: function(data) {
      var records = data.records.map(function(data) {
        return HC.Task.create(data);
      }, this);
      this.rangeDidLoaded(data.total, records);
  },
  _fetchError: function() {
    this.rangeDidLoaded(0, []);
  }
});
