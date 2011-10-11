HttpCron.RecordView = SC.View.extend({
  classNames: ["hc-record"],
  isVisibleBinding: SC.Binding.not('*content.isEditing')
});

HttpCron.NewRecordView = SC.View.extend({
  classNames: ['hc-new-record'],
  contentBinding: 'HttpCron.NewTask',
  isVisibleBinding: 'content.isVisible',
  toggleMethod: 'slideToggle'
});
