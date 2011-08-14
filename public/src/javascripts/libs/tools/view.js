
/* 
 *  @class
 *  SC.View
 */

SC.View.reopen({
  toggleMethod: 'toggle',

  _isVisibleDidChange: function() {
    var method = this.$()[this.get('toggleMethod')];
    if (!method) { method = 'toggle'; }
    method.call(this.$(), this.get('isVisible'));
  }.observes('isVisible'),

  show: function() {
    this.set('isVisible', true);
  },
  hide: function() {
    this.set('isVisible', false);
  },
  toggle: function() {
    this.toggleProperty('isVisible');
  }
});
