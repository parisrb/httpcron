// ===============================================================================
// Project    :   HttpCron
// Copyright  :   ©2011 Paris.rb
// Authors    :   Julien Kirch [archiloque], Paul Chavard [tchak], Vincent Viaud
//
// ===============================================================================

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
