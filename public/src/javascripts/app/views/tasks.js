
HttpCron.createPanes(['Tasks']);

HttpCron.TasksCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.TasksList',
  classNameBindings: 'isLoading',
  tagName: 'ul',
  classNames: ['tasks-list', 'list'],
  itemViewClass: SC.View.extend({
    doubleClick: function() {
      this.get('content').edit();
    },
    mouseEnter: function() {
      this.$('.show-task button').show();
    },
    mouseLeave: function() {
      this.$('.show-task button').hide();
    }
  })
});
