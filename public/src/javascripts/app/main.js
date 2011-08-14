// Create main namespace

HttpCron = SC.Application.create({
  store: SC.Store.create({commitRecordsAutomatically: true}).from('SB.RestDataSource')
});
