HC.TasksCollection = SC.CollectionView.extend({
  contentBinding: 'HC.TasksList',
  classNameBindings: 'isLoading',
  tagName: 'ul',
  classNames: ['hc-records-list', 'hc-list'],
  itemViewClass: SC.View.extend({
    classNameBindings: ['content.isCommiting', 'content.enabled'],
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

HC.TextField = UI.TextField.extend({
  disabledBinding: 'content.isCommiting',
  insertNewline: function() {
    this.getPath('contentView.content').save();
  }
});

HC.Checkbox = UI.Checkbox.extend({
  disabledBinding: 'content.isCommiting'
});
