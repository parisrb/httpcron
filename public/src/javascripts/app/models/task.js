
// Define model
HttpCron.Task = SC.Record.extend({
  primaryKey: 'id',

  name: SC.Record.attr(String, {isRequired: true}),
  url: SC.Record.attr(String, {isRequired: true}),
  cron: SC.Record.attr(String, {isRequired: true, defaultValue: '0 22 * * 1-5'}),
  enabled: SC.Record.attr(Boolean, {isRequired: true, defaultValue: true}),
  created_at: SC.Record.attr(Date),
  timeout: SC.Record.attr(Number, {defaultValue: 60})

});

HttpCron.Task.resourceName = 'tasks';
