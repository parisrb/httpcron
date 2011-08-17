// ===============================================================================
// Project    :   HttpCron
// Copyright  :   ©2011 Paris.rb
// Authors    :   Julien Kirch [archiloque], Paul Chavard [tchak], Vincent Viaud
//
// ===============================================================================

HttpCron.ExecutionsPaneView.reopen({
  titleBinding: 'HttpCron.ExecutionsList.title'
});

HttpCron.ExecutionsCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.ExecutionsList',
  tagName: 'ul',
  classNames: ['executions-list', 'list']
});
