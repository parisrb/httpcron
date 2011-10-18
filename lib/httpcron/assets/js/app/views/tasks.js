HttpCron.TasksCollection = SC.CollectionView.extend({
  contentBinding: 'HttpCron.TasksList',
  classNameBindings: 'isLoading',
  tagName: 'ul',
  classNames: ['hc-records-list', 'hc-list'],
  itemViewClass: SC.View.extend({
    classNameBindings: ['content.isCommiting'],
    doubleClick: function() {
      var content = this.get('content')
      if (content.get('isNotEditing')) {
        content.edit();
      }
    },
    mouseEnter: function() {
      this.$('.hc-record button').show();
    },
    mouseLeave: function() {
      this.$('.hc-record button').hide();
    }
  })
});

HttpCron.TextField = SC.TextField.extend({
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isCommiting'
});

HttpCron.Checkbox = SC.Checkbox.extend({
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isCommiting'
});
