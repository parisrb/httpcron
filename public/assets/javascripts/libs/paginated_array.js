SC.PaginatedArray = SC.ArrayProxy.extend({
  content: [],
  limit: 100,
  offset: 0,
  total: 0,
  isLoading: false,
  reset: function() {
    this.set('offset', 0);
    this.set('total', 0);
    this.set('content', []);
    this.didRequireRange(this.limit, 0);
  },

  reload: function() {
    this.didRequireRange(this.limit, this.offset);
  },

  didRequireRange: function(limit, offset) {
    this.set('isLoading', true);
  },
  rangeDidLoaded: function(total, content) {
    this.set('total', total);
    this.set('content', content);
    this.set('isLoading', false);
  },
  nextPage: function() {
    if (this.get('hasNextPage')) {
      this.incrementProperty('offset');
      this.didRequireRange(this.limit, this.offset);
    }
  },
  previousPage: function() {
    if (this.get('hasPreviousPage')) {
      this.decrementProperty('offset');
      this.didRequireRange(this.limit, this.offset);
    }
  },
  hasNextPage: function() {
    return (this.offset+1)*this.limit < this.total;
  }.property('offset', 'limit', 'total').cacheable(),
  hasPreviousPage: function() {
    return this.offset > 0;
  }.property('offset').cacheable()
});


  // paginatedURL: function(recordType, offset, limit) {
  //   var resourceName = recordType.resourceName,
  //       prefix = this.get('resourcePrefix');
  //   if (prefix) {
  //     resourceName = '%@/%@'.fmt(prefix, resourceName);
  //   }
  //   return "/%@?offset=%@&limit=%@".fmt(resourceName, offset, limit);
  // },

