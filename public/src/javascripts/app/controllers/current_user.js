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
    HttpCron.TasksPaneView.append();
    HttpCron.TasksList.fetch();
  },

  didLoggedOut: function() {
    HttpCron.LoginPaneView.append();
  },

  loginError: function() {
    HttpCron.LoginPaneView.append();
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
