//= require sproutcore

(function() {
var get = SC.get, set = SC.set, getPath = SC.getPath, setPath = SC.setPath;

SC.ActionSupport = SC.Mixin.create({

  targetView: function() {
    return this.get('target') ? this : this.nearestWithProperty('target');
  }.property().cacheable(),

  _parentViewDidChange: function() {
    this.invokeRecursively(function(view) {
      view.propertyDidChange('collectionView');
      view.propertyDidChange('itemView');
      view.propertyDidChange('contentView');
      view.propertyDidChange('targetView');
    });
  }.observes('parentView'),

  targetObject: function() {
    var target = getPath(this, 'targetView.target');

    if (SC.typeOf(target) === 'string') {
      return getPath(this, target);
    } else {
      return target;
    }
  }.property('target').cacheable(),

  fireAction: function(action) {
    if (action === undefined) { action = get(this, 'action'); }
    var target = get(this, 'targetObject');

    if (target && action) {
      if (SC.Statechart && SC.typeOf(target.sendAction) === 'function') {
        return target.sendAction(action, this);
      }
      if (SC.typeOf(action) === 'string') {
        action = target[action];
      }
      return action.call(target, this);
    }
    return false;
  }
});

SC.Button.reopen(SC.ActionSupport, {
  title: null,
  defaultTemplate: SC.Handlebars.compile('{{title}}'),
  attributeBindings: ['type', 'disabled'],

  propagateEvents: false,  
  disabled: false,

  mouseUp: function(event) {
    if (get(this, 'isActive')) {
      this.fireAction();
      set(this, 'isActive', false);
    }

    this._mouseDown = false;
    this._mouseEntered = false;
    return get(this, 'propagateEvents');
  },

  mouseDown: function() {
    set(this, 'isActive', true);
    this._mouseDown = true;
    this._mouseEntered = true;
    return get(this, 'propagateEvents');
  }
});

SC.TextField.reopen({
  attributeBindings: ['autocapitalize', 'pattern', 'disabled'],
  autocapitalize: 'off',
  pattern: null
});

SC.Checkbox.reopen({
  attributeBindings: ['disabled']
});

SC.View.reopen({
  toggleMethod: 'toggle',

  _isVisibleDidChange: function() {
    var method = this.$()[get(this, 'toggleMethod')];
    if (!method) { method = 'toggle'; }
    method.call(this.$(), get(this, 'isVisible'));
  }.observes('isVisible'),

  show: function() {
    set(this, 'isVisible', true);
  },
  hide: function() {
    set(this, 'isVisible', false);
  },
  toggle: function() {
    this.toggleProperty('isVisible');
  }
});

})();
