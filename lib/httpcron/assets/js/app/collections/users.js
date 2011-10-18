HC.UsersList = SB.PaginatedArray.create({
  limit: 10,
  fetch: function() {
    this.reset(true);
  },
  didRequireRange: function(limit, offset) {
    this._super();
    var url = "/api/users?limit=%@&offset=%@".fmt(limit, offset);
    SC.$.ajax(url, {
      dataType: 'json',
      context: this,
      success: this._fetchSuccess,
      error: this._fetchError
    });
  },
  _fetchSuccess: function(data) {
      var records = data.records.map(function(data) {
        return HC.User.create(data);
      }, this);
      this.rangeDidLoaded(data.total, records);
  },
  _fetchError: function() {
    this.rangeDidLoaded(0, []);
  }
});
