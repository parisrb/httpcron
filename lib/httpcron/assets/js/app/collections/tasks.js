HC.TasksList = SB.PaginatedArray.create({
  isLoading: true,
  limit: 50,

  orderBy: 'name',
  order: 'asc',

  orderParam: function() {
    return this.get('orderBy') + '.' + this.get('order');
  }.property('orderBy', 'order').cacheable(),

  fetch: function() {
    this.reset(true);
  },

  reloadWithParams: function() {
    this.reload();
  }.observes('orderParam'),

  didRequireRange: function(limit, offset) {
    this._super();
    this.set('content', []);
    var order = this.get('orderParam');
    var url = '/api/tasks?limit=%@&offset=%@&order=%@'.fmt(limit, offset, order);
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
