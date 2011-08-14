
HttpCron.NewTaskView = SC.View.extend(SB.ToggleViewSupport, {
  classNames: ['new-task'],
  contentBinding: 'HttpCron.NewTask',
  isVisibleBinding: 'content.isVisible',
  toggleMethod: 'slideToggle'
});
