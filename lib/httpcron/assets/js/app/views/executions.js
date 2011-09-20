HttpCron.ExecutionsPaneView.reopen({
  titleBinding: 'HttpCron.ExecutionsList.title'
});

HttpCron.ExecutionsCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.ExecutionsList',
  tagName: 'ul',
  classNames: ['executions-list', 'list']
});
