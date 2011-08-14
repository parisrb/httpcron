
DigestAuthentication.registerInterface();

HttpCron.CurrentUser = SB.CurrentUser.create({
  url: '/api/authenticate',

  didLoggedIn: function() {
    HttpCron.TasksPaneView.append();
    HttpCron.TasksList.fetch();
  },

  didLoggedOut: function() {
    HttpCron.LoginView.append();
  },

  loginError: function() {
    HttpCron.LoginView.append();
  },

  setCredentials: function(username, password) {
    DigestAuthentication.registerCredentials(username, password);
  },

  resetCredentials: function() {
    DigestAuthentication.reset();
  },
});

SC.$(document).ready(function() {
  HttpCron.CurrentUser.login();
});
