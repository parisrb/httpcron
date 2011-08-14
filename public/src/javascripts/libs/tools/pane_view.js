
ST.PaneView = SC.View.extend({
  init: function() {
    this._super();
    var paneName = this.get('name');
    this.set('classNames', ['%@-pane'.fmt(paneName)]);
    var templateName = [ST.PaneView.TEMPLATES_ROOT, paneName].join('_').replace(/^_/, '');
    this.set('templateName', templateName);
  },
  append: function() {
    var currentPane = ST.PaneView.currentPane;
    if (currentPane && currentPane.state === 'inDOM') {
      currentPane.hide();
    }
    if (this.state === 'inDOM') {
      this.show();
    } else {
      this.appendTo(ST.PaneView.SELECTOR); 
    }
    ST.PaneView.currentPane = this;
  }
});

ST.PaneView.reopenClass({
  TEMPLATES_ROOT: null,
  SELECTOR: '[role="application"]',
  currentPane: null,
  panes: []
});

SC.$(document).ready(function() {
  var app = window[ST.APP_NAMESPACE];
  if (ST.PaneView.panes.length > 0 && !app) {
    throw SC.Error("You have to set ST.APP_NAMESPACE to your SC.Application path");
  }
  ST.PaneView.panes.forEach(function(paneName) {
    app["%@PaneView".fmt(paneName)] = ST.PaneView.create({
      name: paneName.toLowerCase()
    });
  });
});
