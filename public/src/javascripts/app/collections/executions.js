// ===============================================================================
// Project    :   HttpCron
// Copyright  :   ©2011 Paris.rb
// Authors    :   Julien Kirch [archiloque], Paul Chavard [tchak], Vincent Viaud
//
// ===============================================================================

HttpCron.ExecutionsList = SB.PaginatedArray.create({
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
      success: this._fetchExecutionsSuccess,
      error: this._fetchExecutionsError
    });
  },
  _fetchExecutionsSuccess: function(data) {
      this.rangeDidLoaded(data.total, data.records);
  },
  _fetchExecutionsError: function() {
    this.rangeDidLoaded(0, []);
  }
});
