HC.UsersPaneView.reopen({
  show: function() {
    this._super();
    HC.UsersList.fetch();
  }
});

HC.UsersCollection = SC.CollectionView.extend({
  contentBinding: 'HC.UsersList',
  classNameBindings: 'isLoading',
  tagName: 'ul',
  classNames: ['hc-records-list', 'hc-list'],
  itemViewClass: SC.View.extend({
    classNameBindings: ['content.isCommiting'],
    doubleClick: function() {
      var content = this.get('content')
      if (content.get('isNotEditing')) {
        content.edit();
      }
    },
    mouseEnter: function() {
      this.$('.hc-record button').show();
    },
    mouseLeave: function() {
      this.$('.hc-record button').hide();
    }
  })
});
