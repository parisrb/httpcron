// ===============================================================================
// Project    :   HttpCron
// Copyright  :   ©2011 Paris.rb
// Authors    :   Julien Kirch [archiloque], Paul Chavard [tchak], Vincent Viaud
//
// ===============================================================================

DigestAuthentication.registerInterface();

HttpCron.CurrentUser = SB.CurrentUser.create({
  url: '/api/authenticate',

  didLoggedIn: function() {
    HttpCron.TasksPaneView.show();
    HttpCron.TasksList.fetch();
  },

  didLoggedOut: function() {
    // FIXME : find out why we have DOM insertion error here
    //HttpCron.TasksList.reset();
    HttpCron.LoginPaneView.show();
  },

  loginError: function() {
    HttpCron.LoginPaneView.show();
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
