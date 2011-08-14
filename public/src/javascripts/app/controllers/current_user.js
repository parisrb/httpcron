HttpCron.User = DigestAuthentication.User.create({
  url: '/api/authenticate',

  didLoggedIn: function() {
    HttpCron.TasksView.append();
    HttpCron.TasksList.fetch();
  },

  didLoggedOut: function() {
    HttpCron.LoginView.append();
  },

  loginDidFail: function() {
    HttpCron.LoginView.append();
  }
});

$(function() {
  HttpCron.User.login();
});
