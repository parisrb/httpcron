HC.TasksCollection = SC.CollectionView.extend({
  contentBinding: 'HC.TasksList',
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

HC.TextField = SC.TextField.extend({
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isCommiting'
});

HC.Checkbox = SC.Checkbox.extend({
  attributeBindings: ['disabled'],
  disabledBinding: 'content.isCommiting'
});
