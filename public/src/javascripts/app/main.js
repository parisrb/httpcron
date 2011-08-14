// Create main namespace

HttpCron = SC.Application.create({
  store: SC.Store.create({commitRecordsAutomatically: true}).from('ST.RestDataSource')
});

ST.APP_NAMESPACE = 'HttpCron';
