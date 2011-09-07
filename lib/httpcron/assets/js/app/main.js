// ===============================================================================
// Project    :   HttpCron
// Copyright  :   ©2011 Paris.rb
// Authors    :   Julien Kirch [archiloque], Paul Chavard [tchak], Vincent Viaud
//
// ===============================================================================

HttpCron = SC.Application.create({
  panes: 'Login Tasks Executions Users'.w()
});

HttpCron.createPanes(HttpCron.panes);
