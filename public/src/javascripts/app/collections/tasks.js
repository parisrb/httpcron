// ===============================================================================
// Project    :   HttpCron
// Copyright  :   ©2011 Paris.rb
// Authors    :   Julien Kirch [archiloque], Paul Chavard [tchak], Vincent Viaud
//
// ===============================================================================

HttpCron.TasksList = SB.PaginatedArray.create({
  isLoading: true,
  limit: 7,
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
      success: this._fetchTasksSuccess,
      error: this._fetchTasksError
    });
  },
  _fetchTasksSuccess: function(data) {
      var tasks = data.records.map(function(task) {
        return HttpCron.Task.create(task);
      }, this);
      this.rangeDidLoaded(data.total, tasks);
  },
  _fetchTasksError: function() {
    this.rangeDidLoaded(0, []);
  }
});
