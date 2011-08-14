HttpCron.User = DigestAuthentication.User.create({
  storageName: 'httpcron.user',
  url: '/api/authenticate',

  didLoggedIn: function() {
    HttpCron.TasksView.append();
    HttpCron.TasksList.fetch();
  },

  didLoggedOut: function() {
    HttpCron.LoginView.append();
  },

  didLoggedInFail: function() {
    HttpCron.LoginView.append();
  }
});

$(function() {
  HttpCron.User.login();
});
