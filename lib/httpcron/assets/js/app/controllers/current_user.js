DigestAuthentication.registerInterface();

HC.CurrentUser = SB.CurrentUser.create({
  url: '/api/authenticate',

  didLoggedIn: function() {
    HC.TasksPaneView.show();
    HC.TasksList.fetch();
  },

  didLoggedOut: function() {
    // FIXME : find out why we have DOM insertion error here
    //HttpCron.TasksList.reset();
    HC.LoginPaneView.show();
  },

  loginError: function() {
    HC.LoginPaneView.show();
  },

  setCredentials: function(username, password) {
    DigestAuthentication.registerCredentials(username, password);
  },

  resetCredentials: function() {
    DigestAuthentication.reset();
  },
});

SC.$(document).ready(function() {
  HC.CurrentUser.login();
});
