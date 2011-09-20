HttpCron.LoginPaneView.reopen({
  contentBinding: 'HttpCron.CurrentUser'
});

HttpCron.LoginTextField = SC.TextField.extend({
  contentBinding: 'parentView.content',
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isLoggingIn',
  insertNewline: function() {
    HttpCron.CurrentUser.login();
  }
});
