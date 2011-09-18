HttpCron.TasksCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.TasksList',
  classNameBindings: 'isLoading',
  tagName: 'ul',
  classNames: ['tasks-list', 'list'],
  itemViewClass: SC.View.extend({
    classNameBindings: ['content.isCommiting'],
    doubleClick: function() {
      var content = this.get('content')
      if (content.get('isNotEditing')) {
        content.edit();
      }
    },
    mouseEnter: function() {
      this.$('.show-task button').show();
    },
    mouseLeave: function() {
      this.$('.show-task button').hide();
    }
  })
});

HttpCron.ShowTaskView = SC.View.extend({
  classNames: ["show-task"],
  isVisibleBinding: SC.Binding.not('*content.isEditing')
});

HttpCron.NewTaskView = SC.View.extend(SB.ToggleViewSupport, {
  classNames: ['new-task'],
  contentBinding: 'HttpCron.NewTask',
  isVisibleBinding: 'content.isVisible',
  toggleMethod: 'slideToggle'
});

HttpCron.TextField = SC.TextField.extend({
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isCommiting'
});

HttpCron.Checkbox = SC.Checkbox.extend({
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isCommiting'
});
