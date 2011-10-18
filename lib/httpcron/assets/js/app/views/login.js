HC.LoginPaneView.reopen({
  contentBinding: 'HC.CurrentUser'
});

HC.LoginTextField = SC.TextField.extend({
  contentBinding: 'parentView.content',
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isLoggingIn',
  insertNewline: function() {
    HC.CurrentUser.login();
  }
});
