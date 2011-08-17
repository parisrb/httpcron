// ===============================================================================
// Project    :   HttpCron
// Copyright  :   ©2011 Paris.rb
// Authors    :   Julien Kirch [archiloque], Paul Chavard [tchak], Vincent Viaud
//
// ===============================================================================

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
