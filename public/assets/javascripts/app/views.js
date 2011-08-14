
HttpCron.PageView = SC.View.extend({
  append: function() {
    if (HttpCron.PageView.currentPage && HttpCron.PageView.currentPage.state === 'inDOM') {
      HttpCron.PageView.currentPage.hide();
    }
    if (this.state === 'inDOM') {
      this.show();
    } else {
      this.appendTo('[role="main"]'); 
    }
    HttpCron.PageView.currentPage = this;
  }
});

HttpCron.LoginView = HttpCron.PageView.create({
  classNames: 'login-page',
  templateName: 'login-page',
  contentBinding: 'HttpCron.User'
});

HttpCron.TasksView = HttpCron.PageView.create({
  templateName: 'tasks-page'
});

HttpCron.ExecutionsView = HttpCron.PageView.create({
  classNames: 'executions-page',
  templateName: 'executions-page',
  titleBinding: 'HttpCron.ExecutionsList.title'
});

HttpCron.LoginTextField = SC.TextField.extend({
  contentBinding: 'parentView.content',
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isLoggingIn'
});

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

HttpCron.ExecutionsCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.ExecutionsList',
  tagName: 'ul',
  classNames: ['executions-list', 'list']
});
