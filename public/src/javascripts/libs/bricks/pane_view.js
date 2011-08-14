// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// pane_view.js
// ==========================================================================
SB = this.SB || {};

SB.PaneView = SC.View.extend({
  init: function() {
    this._super();
    var paneName = this.get('name');
    this.set('classNames', [paneName + '-pane']);
    var templateName = SB.PaneView.templatesPath;
    if (templateName) {
      templateName += '_' + paneName;
    } else {
      templateName = paneName;
    }
    this.set('templateName', templateName);
  },
  append: function() {
    var currentPane = SB.PaneView.currentPane;
    if (currentPane && currentPane.state === 'inDOM') {
      currentPane.hide();
    }
    if (this.state === 'inDOM') {
      this.show();
    } else {
      this.appendTo(SB.PaneView.selector); 
    }
    SB.PaneView.currentPane = this;
  }
});

SC.Application.reopen({
  createPanes: function(panes) {
    (panes || []).forEach(function(paneName) {
      this["%@PaneView".fmt(paneName)] = SB.PaneView.create({
        name: paneName.toLowerCase()
      });
    }, this);
  }
});

SB.PaneView.reopenClass({
  templatesPath: null,
  selector: '[role="application"]',
  currentPane: null
});

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
