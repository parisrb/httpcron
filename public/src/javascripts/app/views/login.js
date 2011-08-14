
HttpCron.LoginView = SB.PaneView.create({
  name: 'login',
  contentBinding: 'HttpCron.CurrentUser'
});

HttpCron.LoginTextField = SC.TextField.extend({
  contentBinding: 'parentView.content',
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isLoggingIn'
});
