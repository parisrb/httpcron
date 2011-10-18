HC.ExecutionsPaneView.reopen({
  titleBinding: 'HC.ExecutionsList.title'
});

HC.ExecutionsCollection = SC.CollectionView.extend({
  contentBinding: 'HC.ExecutionsList',
  tagName: 'ul',
  classNames: ['executions-list', 'hc-list']
});
