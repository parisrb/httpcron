HC.LoginPaneView.reopen({
  contentBinding: 'HC.CurrentUser'
});

HC.LoginTextField = UI.TextField.extend({
  contentBinding: 'parentView.content',
  disabledBinding: 'content.isLoggingIn',
  insertNewline: function() {
    HC.CurrentUser.login();
  }
});
