HttpCron.UsersCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.UsersList',
  classNameBindings: 'isLoading',
  tagName: 'ul',
  classNames: ['users-list', 'list'],
  itemViewClass: SC.View.extend({
    classNameBindings: ['content.isCommiting'],
    doubleClick: function() {
      var content = this.get('content')
      if (content.get('isNotEditing')) {
        content.edit();
      }
    },
    mouseEnter: function() {
      this.$('.show-user button').show();
    },
    mouseLeave: function() {
      this.$('.show-user button').hide();
    }
  })
});
