HttpCron.UsersPaneView.reopen({
  show: function() {
    this._super();
    HttpCron.UsersList.fetch();
  }
});

HttpCron.UsersCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.UsersList',
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
