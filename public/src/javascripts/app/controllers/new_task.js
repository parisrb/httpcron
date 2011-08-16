
HttpCron.NewTask = SC.Object.create({
  nested: null,
  isVisible: false,
  isInvisibleBinding: SC.Binding.not('isVisible'),

  toggle: function() {
    this.toggleProperty('isVisible');
  },

  save: function() {
    this.get('store').commitChanges();
    HttpCron.store.commitRecords();
    //HttpCron.TasksList.reload();
    //this._observeRecord(this.get('record'), SC.Record.READY_CLEAN, this._didSaveRecord);
    this.toggle();
  },

  _didShow: function() {
    if (this.get('isVisible')) {
      var store = this.get('store');
      if (!store) {
        var store = HttpCron.store.chain();
        this.set('store', store);
      } else {
        this.get('store').reset();
      }
      this.set('nested', store.createRecord(HttpCron.Task, {}));
    } else {
      this.set('nested', null);
    }
  }.observes('isVisible')
});
