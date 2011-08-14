
HttpCron.ExecutionsView = ST.PaneView.create({
  name: 'executions',
  titleBinding: 'HttpCron.ExecutionsList.title'
});

HttpCron.ExecutionsCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.ExecutionsList',
  tagName: 'ul',
  classNames: ['executions-list', 'list']
});
