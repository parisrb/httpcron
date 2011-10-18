HC.RecordView = SC.View.extend({
  classNames: ["hc-record"],
  isVisibleBinding: SC.Binding.not('*content.isEditing')
});

HC.NewRecordView = SC.View.extend({
  classNames: ['hc-new-record'],
  contentBinding: 'HC.NewTask',
  isVisibleBinding: 'content.isVisible',
  toggleMethod: 'slideToggle'
});
