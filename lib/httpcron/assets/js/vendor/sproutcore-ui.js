(function() {
UI = SC.Namespace.create();

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, getPath = SC.getPath;

UI.ViewController = SC.Object.extend({

  /**
   *
   */
  view: null,

  /**
   *
   */
  didInsertView: SC.K,

  init: function() {
    this._super();
    this._callbacks = SC.$.Callbacks('unique once');
    this.runWhenInserted(function() {
      this.didInsertView();
    });
  },

  runWhenInserted: function(method) {
    this._callbacks.add(method);
    return this;
  },

  /**
   *
   */
  createView: function() {
    SC.run.schedule('sync', this, function() {
      var view = get(this, 'view');
      view.create.apply(view, [{controller: this}].concat(SC.$.makeArray(arguments)));
    });
    return this;
  },

  /**
   *
   */
  appendTo: function(target) {
    SC.run.schedule('sync', this, function() {
      get(this, 'view').appendTo(target);
    });
    return this;
  },

  /**
   *
   */
  replaceIn: function(target) {
    SC.run.schedule('sync', this, function() {
      get(this, 'view').replaceIn(target);
    });
    return this;
  },

  /**
   *
   */
  destroy: function() {
    get(this, 'view').destroy();
    return this._super();
  },

  /** @private */
  viewStateDidChange: function() {
    if (getPath(this, 'view.state') === 'inDOM') {
      this._callbacks.fireWith(this);
    }
  }.observes('view.state')
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Strobe Inc. and contributors. ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, set = SC.set;

/** 
  @class

  Overview
  =======

  UI.LayoutSupport provides anchoring support for the childviews of any 
  SC.View it is mixed to.

  Anchoring allows a view to get anchored to a side of its parent view. It's
  primarily used when building out the structure of an application. An example
  usage is a toolbar across the top of the page, with a sidebar for the 
  content space under it. In this scenario, the toolbar would be anchored to
  the top of the container view, and the sidebar would be anchored to the
  left of the view under it. 

  You will not generally interact with UI.LayoutSupport directly. Rather, 
  you simply specify the anchorTo property, and the size property, and it'll
  take care of the rest.

  Usage
  =======

  A typical usage scenario is for building a top toolbar and a bottom toolbar
  with a third view filling out the remaining space for content. In that case,
  your handlebars template will look like this:

    {{#view MyApp.ContainerView}}
      {{#view MyApp.TopToolbarView anchorTo="top" size="50"}}

      {{/view}}
      {{#view MyApp.ContentAreaView anchorTo="remainingSpace"}}

      {{/view}}
      {{#view MyApp.BottomToolbarView anchorTo="bottom" size="50"}}

      {{/view}}
    {{/view}}

  And your application's javascript file will be look like so: 

    MyApp.ContainerView = SC.View.extend(UI.LayoutSupport,{...});
    MyApp.TopToolbarView = SC.View.extend(UI.LayoutSupport,{...});
    MyApp.ContentAreaView = SC.View.extend(UI.LayoutSupport,{...});
    MyApp.BottomToolbarView = SC.View.extend(UI.LayoutSupport,{...});

  Notes: 
  --------

  - Each view which mixes-in UI.LayoutSupport becomes the layout manager
    for its children. That means, you can create complex layouts by combining
    the view hierarchy with UI.LayoutSupport.

  - Each UI.LayoutSupported-view supports anchors in a single direction (either
    horizontal or vertical). In other words, you can't have one view with both 
    top and left anchors, but you can create a view with top and bottom anchors.
  
  @extends SC.Mixin
*/
UI.LayoutSupport = SC.Mixin.create({

  hasLayoutSupport: true,

  anchorTo: 'remainingSpace',
  size: null,

  _layout: null,

  layoutManager: null,

  init: function() {

    set(this,'layoutManager', UI.LayoutManager.create({}));

    return this._super();
  },

  _getLayoutManager: function() {
    if (this._managerCache) return this._managerCache;
    var manager = null,
        view = get(this, 'parentView');

    while (view) {
      manager = get(view, 'layoutManager');
      if (manager) { break; }

      view = get(view, 'parentView');
    }

    manager = this._managerCache = manager || UI.rootLayoutManager;
    return manager;
  },

  applyLayout: function(layout, buffer) {
    if (buffer) {
      buffer.style('position','absolute');

      for (var prop in layout) {
        buffer.style(prop, layout[prop]); 
      }
    } else {
      this.$().css(layout);
    }
  },

  render: function(buffer) {
    var layoutManager = this._getLayoutManager();

    var layout = this._layout = layoutManager.layoutForManagedView(this, get(this,'anchorTo'), {
      size: get(this, 'size')
    });

    if (layout) {
      this.applyLayout(layout, buffer);
    }

    return this._super(buffer);
  },

  destroy: function() {

    var manager = this._getLayoutManager();
    manager.destroy();

    this._managerCache = undefined;

    return this._super();
  }

});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, set = SC.set;

UI.ViewControllerSupport = SC.Mixin.create({

  controller: null,

  init: function() {
    this._super();
    SC.run.schedule('sync', this, 'initWithController');
  },

  initWithController: function() {
    var controller = get(this, 'controller');

    if (!controller) {
      throw new SC.Error('%@ - Unable to initialize view without controller.'.fmt(this));
    }

    if (SC.typeOf(controller) === 'string') {
      controller = SC.getPath(controller);
      set(this, 'controller', controller); 
    }

    if (!get(this, 'target')) {
      set(this, 'target', controller);
    }
    set(controller, 'view', this);
  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



var get = SC.get, set = SC.set, setPath = SC.setPath;

/**
  @extends SC.ContainerView
 */
UI.StackView = SC.ContainerView.extend(UI.LayoutSupport, UI.ViewControllerSupport, {
  classNames: ['ui-stack'],

  /**
   *
   */
  currentView: null,

  /**
   *
   */
  defaultAnimation: 'fade',

  /**
   *
   */
  addView: function(view, viewName) {
    view = this.createChildView(view, {isVisible: false, viewName: viewName});
    get(this, 'childViews').pushObject(view);
    return view;
  },

  /**
   *
   */
  showView: function(view, animation) {
    var currentView = get(this, 'currentView');
    if (currentView === view) {
      return;
    }
    if (currentView) {
      if (!animation) {
        set(currentView, 'isVisible', false);
        set(this, 'currentView', view);
      } else {
        if (animation === true) {
          animation = get(this, 'defaultAnimation');
        }
        this.animate(animation, currentView, view);
      }
      set(view, 'isVisible', true);
    } else {
      set(view, 'isVisible', true);
      set(this, 'currentView', view);
    }
  },

  /**
   *
   */
  removeView: function(view) {
    view.destroy();
  },

  animate: function(animationName, fromView, toView) {
    var animation = UI.StackView.animations[animationName];
    if (!animation) {
      throw new SC.Error('Animation %@ is undefined'.fmt(animationName));
    }

    fromView.setProperties({
      animationTimeline: animation['out'],
      animationDuration: animation.duration
    }).animate();

    toView.setProperties({
      animationTimeline: animation['in'],
      animationDuration: animation.duration
    }).animate(this, 'didAnimatedToView');
  },

  /** @private */
  didAnimatedToView: function(view) {
    var currentView = get(this, 'currentView');
    set(currentView, 'isVisible', false);
    currentView.resetAnimation();
    set(this, 'currentView', view);
  }
});

UI.StackView.animations = {
  slideLeft: {
    duration: 300,
    'in': {
      '0%': function(w) {
        return {translateX: w};
      },
      '100%': function() {
        return {translateX: 0};
      }
    },
    'out': {
      '0%': function() {
        return {translateX: 0};
      },
      '100%': function(w) {
        return {translateX: -w};
      }
    }
  },
  slideRight: {
    duration: 300,
    'in': {
      '0%': function(w) {
        return {translateX: -w};
      },
      '100%': {
        translateX: 0
      }
    },
    'out': {
      '0%': {
        translateX: 0
      },
      '100%': function(w) {
        return {translateX: w};
      }
    }
  },
  flipLeft: {
    duration: 300,
    'in': {
      '0%': {
        webkitBackfaceVisibility: 'hidden',
        rotateY: -3.15,
        scale: 0.8
      },
      '100%': {
        rotateY: 0,
        scale: 1
      }
    },
    'out': {
      '0%': {
        webkitBackfaceVisibility: 'hidden',
        rotateY: 0,
        scale: 1
      },
      '100%': {
        rotateY: 3.15,
        scale: 0.8
      }
    }
  },
  flipRight: {
    duration: 300,
    'in': {
      '0%': {
        webkitBackfaceVisibility: 'hidden',
        rotateY: 3.15,
        scale: 0.8
      },
      '100%': {
        rotateY: 0,
        scale: 1
      }
    },
    'out': {
      '0%': {
        webkitBackfaceVisibility: 'hidden',
        rotateY: 0,
        scale: 1
      },
      '100%': {
        rotateY: -3.15,
        scale: 0.8
      }
    }
  },
  cubeRight: {
    duration: 550,
    'in': {
      '0%': function(w) {
        return {
          webkitTransformOrigin: '0% 50%',
          rotateY: -1.57,
          translateZ: w,
          scale: 0.5,
          opacity: 0.5
        };
      },
      '100%': {
        rotateY: 0,
        translateZ: 0,
        scale: 1,
        opacity: 1
      }
    },
    'out': {
      '0%': {
        webkitTransformOrigin: '100% 50%',
        rotateY: 0,
        translateX: 0,
        scale: 1,
        opacity: 1
      },
      '100%': function(w) {
        return {
          rotateY: 1.57,
          translateZ: w,
          scale: 0.5,
          opacity: 0.5
        };
      }
    }
  }
};

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Strobe Inc. and contributors. ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


var get = SC.get, set = SC.set;

/**
  @extends UI.StackView
 */
UI.NavigationView = UI.StackView.extend({
  classNames: ['ui-navigation'],

  didInsertElement: function() {
    var controller = get(this, 'controller'),
        template = get(this, 'template');

    if (template) {
      set(this, 'template', null);
      var view = UI.View.extend({template: template});
      controller.pushView(view);
    }

    this._super();
  },

  /**
   *
   */
  pushView: function(view, animation) {
    view = this.addView(view);
    this.showView(view, animation);
    return view;
  },

  /**
   *
   */
  removeView: function(view, animation) {
    this._super(view);
  }

});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Strobe Inc. and contributors. ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



var set = SC.set, get = SC.get;

UI.NavigationViewController = UI.ViewController.extend({

  _stack: null,

  view: UI.NavigationView,

  /**
   *
   */
  pushView: function(view, animation) {
    SC.run.schedule('render', this, function() {
      view = get(this, 'view').pushView(view);
      this._stack.push(view);
    });
  },

  /**
   *
   */
  popView: function(animation) {
    var view = this._stack.pop();
    get(this, 'view').removeView(view, animation);
    return view;
  },

  /**
   *
   */
  destroy: function() {
    var view = this.popView(false);
    while (view) {
      view = this.popView(false);
    }
    return this._super();
  },

  init: function() {
    this._super();
    this._stack = [];
  },

  /** @private */
  didInsertView: function() {

  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Strobe Inc. and contributors. ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;

UI.THEMES = {};

UI._Templates = SC.Object.extend({

  themeTemplates: null,

  unknownProperty: function(key) {
    var themeTemplates = get(this,'themeTemplates'),
        template = themeTemplates ? themeTemplates[key] : null;

    return template || SC.TEMPLATES[key];
  }
});

/**
  @extends SC.Mixin
*/
UI.ThemeSupport = SC.Mixin.create({
  
  /**
    @property String
  */
  themeName: null,

  /** @private */
  themeClassNameBinding: SC.Binding.oneWay('themeName').transform(function(themeName) {
    return themeName ? 'ui-theme-%@'.fmt(themeName) : false;
  }),

  /** @private */
  classNameBinding: ['themeClassName'],

  /**
    Returns a hash to find the templateName in

    First, try to see if the theme overrides the template. If it does, use that
    one. Otherwise, return SC.TEMPLATES
  */
  templatesBinding: SC.Binding.oneWay('themeName').transform(function(themeName) {
    return UI._Templates.create({themeTemplates: UI.THEMES[themeName]});
  })
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



var set = SC.set, get = SC.get;

/**
  @extends SC.View
 */
UI.PopoverView = SC.View.extend(UI.ViewControllerSupport, UI.ThemeSupport, {
  classNames: ['ui-popover'],
  isVisible: false,

  /**
   *
   */
  showView: function(animation) {
    if (animation) {
      
    } else {
      set(view, 'isVisible', true);
    }
  },

  /**
   *
   */
  hideView: function(animation) {
    if (animation) {
      
    } else {
      set(view, 'isVisible', false);
    }
  },

  /**
   *
   */
  applyLayout: function(layout, animation) {
    var cssLayout = {
      position: 'absolute',
      width: layout.width,
      height: layout.height
    };
    switch (layout.verticalAnchor) {
    case 'center':
      cssLayout.top = '50%';
      cssLayout.marginTop = (-(layout.height / 2) + layout.y) + 'px';
      break;
    case 'top':
    case 'bottom':
      cssLayout[layout.verticalAnchor] = layout.y + 'px';
    }
    switch (layout.horizontalAnchor) {
    case 'center':
      cssLayout.left = '50%';
      cssLayout.marginLeft = (-(layout.width / 2) + layout.x) + 'px';
      break;
    case 'left':
    case 'right':
      cssLayout[layout.horizontalAnchor] = layout.x + 'px';
    }
    this.$().css(cssLayout);
  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



var set = SC.set, get = SC.get;

UI.PopoverViewController = UI.ViewController.extend({

  view: UI.PopoverView,

  /**
  */
  verticalAnchor: 'center',

  /**
  */
  horizontalAnchor: 'center',

  /**
  */
  x: 0,

  /**
  */
  y: 0,

  /**
  */
  width: 100,

  /**
  */
  height: 50,

  /**
  */
  animatedLayout: false,

  /**
   @property {Object}
   */
  layout: function() {
    return this.getProperties('verticalAnchor', 'horizontalAnchor', 'x', 'y', 'width', 'height');
  }.property('verticalAnchor', 'horizontalAnchor', 'x', 'y', 'width', 'height').cacheable(),

  /**
   *
   */
  show: function(animation) {
    get(this, 'view').showView(animation);
    this.layoutDidChange();
  },

  /**
   *
   */
  hide: function(animation) {
    get(this, 'view').hideView(animation);
  },

  /** @private */
  layoutDidChange: function() {
    get(this, 'view').applyLayout(get(this, 'layout'), get(this, 'animatedLayout'));
  }.observes('layout')
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


var get = SC.get, set = SC.set;

/**
  @extends UI.StackView
 */
UI.TabView = UI.StackView.extend({
  classNames: ['ui-tab'],

  render: function(buffer) {
    var template = get(this, 'template');

    if (template) {
      var context = get(this, 'templateContext'),
          data = { view: this, buffer: buffer, isRenderData: true };

      // Invoke the template with the provided template context, which
      // is the view by default. A hash of data is also passed that provides
      // the template with access to the view and render buffer.

      // The template should write directly to the render buffer instead
      // of returning a string.
      var output = template(context, { data: data });

      // If the template returned a string instead of writing to the buffer,
      // push the string onto the buffer.
      if (output !== undefined) { buffer.push(output); }
      set(this, 'template', null);
      this.rerender();
    } else {
      this._super(buffer);
    }
  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



var get = SC.get, set = SC.set, getPath = SC.getPath;

UI.TabViewController = UI.ViewController.extend({

  _tabs: null,

  view: UI.TabView,

  /**
   *
   */
  addView: function(view) {
    SC.run.schedule('sync', this, function() {
      view = get(this, 'view').addView(view);
      this._tabs.push(view);
    });
  },

  /**
   *
   */
  removeView: function(view) {
    SC.run.schedule('sync', this, function() {
      if (typeof view === 'string') {
        view = SC.View.views[view];
      }
      get(this, 'view').removeView(view);
      this._tabs.removeObject(view);
    });
  },

  /**
   *
   */
  selectView: function(view, animation, _no_schedule) {
    SC.run.schedule('sync', this, function() {
      var viewName;
      if (typeof view === 'string') {
        viewName = view;
        view = SC.View.views[view];
      }
      if (view && this._tabs.contains(view)) {
        get(this, 'view').showView(view, animation);
      } else if (viewName && !_no_schedule) {
        this.runWhenInserted(function() {
          this.showView(viewName, animation, true);
        });
      }
    });
  },

  /**
   *
   */
  destroy: function() {
    var view = this._tabs.pop();
    while (view) {
      this.removeView(view);
      view = this._tabs.pop();
    }
    return this._super();
  },

  /** @private */
  init: function() {
    this._super();
    this._tabs = [];
  },

  /** @private */
  didInsertView: function() {
    var view = get(this, 'view');
    get(view, 'childViews').forEach(function(tabView, i) {
      if (i === 0) {
        set(view, 'currentView', tabView);
      } else {
        set(tabView, 'isVisible', false);
      }
      this._tabs.push(tabView);
    }, this);
  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, escapeHTML = SC.Handlebars.Utils.escapeExpression;

/**
  @extends SC.Mixin
*/
UI.TitleSupport = SC.Mixin.create({

  /**
    @property {String}
  */
  title: null,

  /**
    @property {String}
  */
  localize: false,

  /**
    @property {String}
  */
  escapeHTML: true,

  /**
   @property {Boolean}
  */
  bindTitle: true,

  /** @private */
  formattedTitle: function() {
    var title = get(this, 'title');
    if (!SC.empty(title)) {
      if (get(this, 'localize')) {
        title = SC.String.loc(title);
      }
      if (get(this, 'escapeHTML')) {
        title = escapeHTML(title);
      }
    }
    return title;
  }.property('title', 'escapeHTML', 'localize').cacheable()

});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


var get = SC.get, set = SC.set;

/**
  @static
  @constant
  @type String
*/
UI.TOGGLE_BEHAVIOR = 'toggle';

/**
  @static
  @constant {String}
*/
UI.PUSH_BEHAVIOR =   'push';

/**
  @static
  @constant
  @type String
*/
UI.TOGGLE_ON_BEHAVIOR = 'on';

/**
  @static
  @constant {String}
*/
UI.TOGGLE_OFF_BEHAVIOR = 'off';

/**
  @static
  @constant {String}
*/
UI.HOLD_BEHAVIOR = 'hold';

/**
  @extends SC.Mixin
  @mixins UI.TitleSupport
 */
UI.ButtonSupport = SC.Mixin.create(UI.TitleSupport, {
  classNameBindings: ['isDefault:default', 'isCancel:cancel', 'buttonBehavior', 'value:on'],

  /**
    If true, then this button will be triggered when you hit return.

    This will also apply the "default" classname to the button.

    @property {Boolean}
    @default false
  */
  isDefault: false,

  /**
    If true, then this button will be triggered when you hit escape.

    This will also apply the "cancel" classname to the button.

    @property {Boolean}
    @default false
  */
  isCancel: false,

  /**
    The behavioral mode of this button.

    Possible values are:

     - `UI.PUSH_BEHAVIOR` -- Pressing the button will trigger an action tied to the
       button. Does not change the value of the button.
     - `UI.TOGGLE_BEHAVIOR` -- Pressing the button will invert the current value of
       the button. If the button has a mixed value, it will be set to true.
     - `UI.TOGGLE_ON_BEHAVIOR` -- Pressing the button will set the current state to
       true no matter the previous value.
     - `UI.TOGGLE_OFF_BEHAVIOR` -- Pressing the button will set the current state to
       false no matter the previous value.
     - `UI.HOLD_BEHAVIOR` -- Pressing the button will cause the action to repeat at a
       regular interval specifed by 'holdInterval'

    @property {String}
    @default SC.PUSH_BEHAVIOR
  */
  buttonBehavior: UI.PUSH_BEHAVIOR,

  /*
    If buttonBehavior is `UI.HOLD_BEHAVIOR`, this specifies, in milliseconds,
    how often to trigger the action. Ignored for other behaviors.

    @property {Number}
    @default 100
  */
  holdInterval: 100,

  /*
    @property {Boolean}
    @default true
  */
  isResponder: true,

  mouseUp: function(event) {
    if (get(this, 'isActive')) {
      var buttonBehavior = get(this, 'buttonBehavior');

      switch (buttonBehavior) {
      case UI.PUSH_BEHAVIOR:
        this.triggerAction();
        break;
      case UI.TOGGLE_BEHAVIOR:
        this.toggleProperty('value');
        break;
      case UI.TOGGLE_ON_BEHAVIOR:
        set(this, 'value', true);
        break;
      case UI.TOGGLE_OFF_BEHAVIOR:
        set(this, 'value', false);
        break;
      }
      set(this, 'isActive', false);
    }

    this._mouseDown = false;
    this._mouseEntered = false;
  },

  keyUp: function(event) {
    this.interpretKeyEvents(event);
    return false;
  },

  insertNewline: function() {
    if (get(this, 'isDefault')) {
      this.triggerAction();
    }
  },

  cancel: function() {
    if (get(this, 'isCancel')) {
      this.triggerAction();
    }
  },

  /** @private */
  interpretKeyEvents: function(event) {
    var map = UI.ButtonSupport.KEY_EVENTS;
    var method = map[event.keyCode];

    if (method) { return this[method](event); }
  },

  triggerAction: function() {
    this.$().closest('form').submit();
    this._super();
  }
});

UI.ButtonSupport.KEY_EVENTS = {
  13: 'insertNewline',
  27: 'cancel'
};

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


/**
  @extends SC.Button
  @mixins UI.ButtonSupport
 */
UI.Button = SC.Button.extend(UI.ButtonSupport, {
  classNames: ['ui-button'],

  /**
    The WAI-ARIA role of the button.
    
    @type String
    @default 'button'
    @readOnly
  */
  ariaRole: 'button',

  /** @private */
  defaultTemplate: SC.Handlebars.compile('{{{formattedTitle}}}')
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



/**
  @extends SC.Checkbox
  @mixins UI.TitleSupport
 */
UI.Checkbox = SC.Checkbox.extend(UI.TitleSupport, {
  tagName: 'label',
  classNames: ['ui-checkbox'],
  defaultTemplate: SC.Handlebars.compile('<input type="checkbox" {{bindAttr checked="value" disabled="disabled"}}/>{{{formattedTitle}}}')
});

/**
  @extends SC.Checkbox
  @mixins UI.ButtonSupport
 */
// UI.Checkbox = SC.Checkbox.extend(UI.ButtonSupport, {
//   tagName: 'label',
//   classNames: ['ui-checkbox'],
//   buttonBehavior: UI.TOGGLE_BEHAVIOR,
//   value: true,
//   defaultTemplate: SC.Handlebars.compile('<input type="checkbox" {{bindAttr checked="value" disabled="disabled"}}/>{{{formattedTitle}}}')
// });

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;

/**
  @extends SC.View
  @mixins SC.TargetActionSupport
*/
UI.Form = SC.View.extend(SC.TargetActionSupport, {
  tagName: 'form',
  classNames: ['sc-form'],

  submit: function(evt) {
    evt.preventDefault();
    this.triggerAction();
  },

  fields: function() {
    var views = SC.View.views;
    return this.$().find('input.sc-view, textarea.sc-view, select.sc-view').toArray().map(function(el) {
      return views[el.id];
    });
  }.property()
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, set = SC.set;

/**
  @extends SC.TextField
 */
UI.TextField = SC.TextField.extend(UI.TitleSupport, SC.TargetActionSupport, {
  classNames: ['ui-text-field'],

  /**
    @property {String}
  */
  autocomplete: 'on',

  /**
    @property {String}
  */
  autocapitalize: 'off',

  /**
    @property {Boolean}
  */
  clearOnEsc: false,

  /**
    @property {Boolean}
  */
  blurOnEnter: false,

  /**
    @property {Boolean}
  */
  isDefault: false,

  insertNewline: function() {
    if (get(this, 'isDefault')) {
      this.triggerAction();
    }
    if (get(this, 'blurOnEnter')) {
      this.blur();
    }
  },

  cancel: function() {
    if (get(this, 'clearOnEsc')) {
      this.clear();
    }
  },

  /**
    Clear the value and gain focus
  */
  clear: function() {
    set(this, 'value', '');
    this.focus();
  },

  /** @private */
  attributeBindings: ['autocomplete', 'autocapitalize'],

  /** @private */
  placeholderBinding: 'formattedTitle'
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


/**
  @extends UI.TextField
 */
UI.NumericField = UI.TextField.extend({
  classNames: ['ui-numeric-field'],
  type: 'number',

  /**
   @property {String}
  */
  autocomplete: 'off',

  /**
   @property {String}
  */
  pattern: '[0-9]*',

  /**
   @property {Number}
  */
  min: null,

  /**
   @property {Number}
  */
  max: null,

  /** @private */
  attributeBindings: ['pattern', 'min', 'max']
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, set = SC.set;

var valueProperty = SC.computed(function(key, value) {
  if (value !== undefined) {
    // normalize invalid value
    if (typeof value !== 'number') {
      value = 0;
    }
    this._value = value;
  }
  return Math.min(get(this, 'max'), Math.max(get(this, 'min'), this._value));
}).property('max', 'min').cacheable();

/**
  @extends SC.View
*/
UI.ProgressIndicator = SC.View.extend({
  classNames: ['ui-progress-indicator'],

  /**
    @property {Number}
  */
  value: 0,

  /**
    @property {Number}
  */
  min: 0,

  /**
    @property {Number}
  */
  max: 100,

  /**
    @property {Number}
  */
  percentage: 0,

  /**
    @property {Number}
  */
  isComplete: false,

  didInsertElement: function() {
    this.propertyDidChange('value');
  },

  /** @private */
  defaultTemplate: SC.Handlebars.compile('<div></div>'),

  init: function() {
    this._super();
    this._value = get(this, 'value');
    SC.defineProperty(this, 'value', valueProperty);
  },

  willChangeValue: function() {
    var value = get(this, 'value'),
        max = get(this, 'max'),
        percentage = 100 * value / max;
    set(this, 'isComplete', value === max);
    set(this, 'percentage', percentage);

    this.$('> div:first-child')
      .toggle(value > get(this, 'min'))
      .width(percentage.toFixed(0) + "%");

    this.didChangeValue.call(this, value);
  }.observes('value'),

  didChangeValue: SC.K
});


})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


/**
  @extends UI.TextField
 */
UI.SearchField = UI.TextField.extend({
  classNames: ['ui-search-field'],
  autocomplete: 'off',
  type: 'search',
  clearOnEsc: true,
  blurOnEnter: true
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/**
  @extends SC.CollectionView
 */
UI.SegmentedButton = SC.CollectionView.extend({
  classNames: ['ui-segmented-button']
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


var get = SC.get, set = SC.set, getPath = SC.getPath, setPath = SC.setPath;

UI.SelectableItemSupport = SC.Mixin.create(UI.TitleSupport, {
  disabled: false,
  titleBinding: 'content.title',
  selectedBinding: 'content.selected',

  localizeBinding: SC.Binding.oneWay('collectionView.localize'),

  defaultTemplate: SC.Handlebars.compile('{{{formattedTitle}}}'),

  toggle: function() {
    var collectionView = get(this, 'collectionView'),
        multiple = get(collectionView, 'multiple'),
        selection = getPath(collectionView, 'content.selection'),
        content = get(this, 'content');
    if (multiple) {
      if (!selection) {
        selection = [];
        setPath(collectionView, 'content.selection', selection);
      }
      if (selection.contains(content) && get(content, 'selected')) {
        selection.removeObject(content);
        set(content, 'selected', false);
      } else {
        selection.pushObject(content);
        set(content, 'selected', true);
      }
    } else {
      if (selection) {
        set(selection, 'selected', false);
      }
      if (selection !== content) {
        setPath(collectionView, 'content.selection', content);
        set(content, 'selected', true);
      }
    }
    collectionView.triggerAction();
  }
});

UI.SelectableSupport = SC.Mixin.create(SC.TargetActionSupport, {
  disabled: false,
  multiple: false,
  localize: false,
  action: 'select',
  selection: null,

  selectionDidChange: function() {
    var selection = getPath(this, 'content.selection');
    set(this, 'selection', selection);
  }.observes('content.selection'),

  arrayWillChange: function(content, start, removed) {
    var selected, idx, obj;

    if (content && removed) {
      for (idx = start; idx < start+removed; idx++) {
        obj = content.objectAt(idx);

        if (selected = get(content, 'selection')) {
          if (SC.isArray(selected) && selected.contains(obj)) {
            selected.removeObject(obj);
          } else if (selected === obj) {
            set(content, 'selection', null);
          }
          set(obj, 'selected', false);
        }
      }
    }

    this._super(content, start, removed);
  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


var get = SC.get, set = SC.set, getPath = SC.getPath;

/**
  @extends SC.View
  @mixins UI.SelectableItem
*/
UI.SelectOption = SC.View.extend(UI.SelectableItemSupport, {
  tagName: 'option',
  classNames: ['ui-select-option'],
  attributeBindings: ['value', 'selected', 'disabled'],

  valueBinding: 'content.value'
});

/**
  @extends SC.CollectionView
  @mixins UI.Selectable
*/
UI.Select = SC.CollectionView.extend(UI.SelectableSupport, {
  tagName: 'select',
  classNames: ['ui-select'],
  attributeBindings: ['multiple', 'disabled'],

  itemViewClass: UI.SelectOption,

  selectionDidChange: function() {
    var selection = getPath(this, 'content.selection');
    if (selection) {
      set(this, 'selection', selection);
      set(this, 'value', get(selection, 'value'));
    }
  }.observes('content.selection'),

  willInsertElement: function() {
    this._elementValueDidChange();
  },

  change: function() {
    this._elementValueDidChange();
  },

  _elementValueDidChange: function() {
    var views = SC.View.views,
        selectedOptions = this.$('option:selected');

    if (get(this, 'multiple')) {
      selectedOptions.toArray().forEach(function(el) {
        views[el.id].toggle();
      });
    } else {
      views[selectedOptions.prop('id')].toggle();
    }
  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var set = SC.set, get = SC.get;

/**
  @extends SC.View
 */
UI.Slider = SC.View.extend({
  classNames: ['ui-slider']
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Strobe Inc. and contributors. ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, set = SC.set;

/**
  Handlebars helper for all structural views in SproutCore UI.

  The helper expects the path to be either a path to an instance of a 
  view controller, or the view controller class. For example, a navigation
  view controller could be implemented either as:

    {{ui NavigationViewController contentBinding="MyNewsApp.storiesController.topStories"}}

  Where MyNewsApp.navigationViewController is an instance of UI.NavigationViewController.
  This will create an anonymous view controller and bind its content property
  to the specified content array.

  Alternatively, the same view controller could be implemented as:

    {{ui MyNewsApp.navigationViewController}} 

  Note that the type of view is inferred automatically. 

  The convention is to use the former style when the name of the class makes 
  it hard to guess what type of view it is, where as the latter style is 
  preffered when it eliminates duplication in the naming.
 */
SC.Handlebars.registerHelper('ui', function(path, options) {
  sc_assert("The ui helper only takes a single argument", arguments.length <= 2);

  // If no path is provided, treat path param as options.
  if (path && path.data && path.data.isRenderData) {
    options = path;
    path = 'UI.View';

    return SC.Handlebars.ViewHelper.helper(this, path, options);
  }
  
  var controller = SC.getPath(path),
      viewClass = get(controller, 'view'),
      itemHash = {controller: controller};

  if (!SC.View.detect(viewClass)) {
    throw new SC.Error('%@ - View is alredy initialized or not found'.fmt(viewClass));
  }

  if (options.fn) {
    itemHash.template = options.fn;
    delete options.fn;
  }
  viewClass = SC.Handlebars.ViewHelper.viewClassFromHTMLOptions(viewClass, itemHash);
  return SC.Handlebars.helpers.view.call(this, viewClass, options);
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, set = SC.set;

UI.AnimatableSupport = SC.Mixin.create({
  isAnimatable: true,

  _animation: null,

  /**
   *
   */
  animationDuration: 'fast',

  /**
   *
   */
  animationTimeline: function(key, value) {
    if (value !== undefined) {
      this.resetAnimation();
      if (value === null) {
        return null;
      }
      var currentState = {}, step, _key,
        w = this.$().width(), h = this.$().height();
      
      this._animation = {};
      this._animation.timeline = SC.keys(value).filter(function(key) {
        return key.match(/[0-9]?[0-9]%$/);
      }).sort().map(function(key) {
        step = value[key];
        if (typeof step === 'function') {
          step = step(w, h);
        }
        for (_key in step) {
          if (step.hasOwnProperty(_key) && !currentState[_key]) {
            currentState[_key] = this.$().css(_key);
          }
        }
        return step;
      }, this);
      this._animation.currentState = currentState;
      return this._animation.timeline;
    }
  }.property().cacheable(),

  animate: function(target, action) {
    var timeline = get(this, 'animationTimeline'),
        duration = get(this, 'animationDuration');
    if (timeline && duration) {
      if (target && typeof action === 'string') {
        action = target[action];
      }
      timeline = SC.copy(timeline);
      this.$().css(timeline.shift());
      var step = timeline.shift();
      while (step) {
        var options = {
          duration: duration,
          queue: true
        };
        if (timeline.length === 0 && target && action) {
          options.complete = SC.$.proxy(function() {
            action.call(target, this);
          }, this);
        }
        this.$().animate(step, options);
        step = timeline.shift();
      }
    }
  },

  /**
   *
   */
  resetAnimation: function() {
    if (this._animation) {
      if (this._animation.currentState) {
        this.$().css(this._animation.currentState);
      }
      this._animation = null;
    }
  }

});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

UI.ScrollableSupport = SC.Mixin.create({
  hasHorizontalScroller: false,
  hasVerticalScroller: true,

  didInsertElement: function() {
    this._super();
    this.propertyDidChange('hasVerticalScroller');
    this.fixiOSScroll();
  },

  scrollersDidChange: function() {
    this.$().css({
      'overflow-x': get(this, 'hasHorizontalScroller') ? 'scroll' : 'hidden',
      'overflow-y': get(this, 'hasVerticalScroller') ? 'scroll' : 'hidden'
    });
  }.observes('hasHorizontalScroller', 'hasVerticalScroller'),

  /**
   * ScrollFix v0.1
   * http://www.joelambert.co.uk
   *
   * Copyright 2011, Joe Lambert.
   * Free to use under the MIT license.
   * http://www.opensource.org/licenses/mit-license.php
   */
  fixiOSScroll: function() {
    // Variables to track inputs
    var startY = startTopScroll = deltaY = undefined,
        elem = this.$().css('-webkit-overflow-scrolling', 'touch')[0];
    
    // Handle the start of interactions
    elem.addEventListener('touchstart', function(event) {
      startY = event.touches[0].pageY;
      startTopScroll = elem.scrollTop;
    
      if (startTopScroll <= 0) {
        elem.scrollTop = 1;
      }

      if (startTopScroll + elem.offsetHeight >= elem.scrollHeight) {
        elem.scrollTop = elem.scrollHeight - elem.offsetHeight - 1;
      }
    }, false);
  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, set = SC.set, getPath = SC.getPath;

/**
  @extends SC.Mixin
 */
UI.SearchableSupport = SC.Mixin.create({  
  isSearchable: true,

  /**
    @property {String}
  */
  searchText: null,
  
  /**
    @property {String}
  */
  searchKey: 'name',
  
  /**
    @property {Array}
  */
  content: [],

  /**
    @property {Number}
  */
  searchPause: 100,

  /**
    @property {Number}
  */
  minSearchLen: 1,

  /**
    @property {Boolean}
  */
  isBusy: false,

  init: function() {
    this._super();
    this._runSearch();
  },

  _searchDidChange: function() {
    var searchPause = get(this, 'searchPause'),
        searchText = get(this, 'searchText') || "",
        minSearchLen = get(this, 'minSearchLen');
        
    // Check for min length
    if (searchText.length < minSearchLen) {
      this.reset();
      return;
    }
    
    if (searchPause > 0) {
      this._setSearchInterval(searchPause);
    } else {
      this._runSearch();
    }
  }.observes('searchText'),

  _setSearchInterval: function(searchPause) {
    SC.run.cancel(this._searchTimer);
    this._searchTimer = SC.run.later(this, '_runSearch', searchPause);
  },

  _sanitizeSearchString: function(str) {
    var specials = [
        '/', '.', '*', '+', '?', '|',
        '(', ')', '[', ']', '{', '}', '\\'
    ];
    this._cachedRegex = this._cachedRegex || new RegExp('(\\' + specials.join('|\\') + ')', 'g');
    return str.replace(this._cachedRegex, '\\$1');
  },

  _runSearch: function() {
    var searchText = get(this, 'searchText');
    if (!SC.empty(searchText)) {
      searchText = this._sanitizeSearchString(searchText).toLowerCase();
      set(this, 'isBusy', true);
      this.runSearch(searchText, get(this, 'searchKey'));
    } else {
      this.reset();
    }
  },

  /**
    OVERRIDE to change search results loading logic
    @param {Array} searchResults an array of found results
  */
  loadSearchResults: function(searchResults) {
    get(this, 'content').replace(0, getPath(this, 'content.length'), searchResults);
    set(this, 'isBusy', false);
  },

  /**
    OVERRIDE to give the custom searching functionality

    @param {String} searchText a text to search for
    @param {String} searchKey parameter to search in
  */
  runSearch: function(searchText, searchKey) {
    this.loadSearchResults([]);
  },

  /** 
    OVERRIDE to change reset logic
  */
  reset: function() {
    this.loadSearchResults();
  } 
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, getPath = SC.getPath;

SC.TargetActionSupport.reopen({

  targetObject: SC.computed(function() {
    var target = get(this, 'target');
    if (!target) {
      target = getPath(this, 'targetView.target');
    }

    if (SC.typeOf(target) === "string") {
      return getPath(this, target);
    } else {
      return target;
    }
  }).property('target', 'targetView').cacheable()
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;

/**
  @extends SC.Mixin
*/
UI.TextSelectionSupport = SC.Mixin.create({
  disableTextSelection: true,

  /** @private */
  classNameBindings: ['disableTextSelection:sc-ui-disable-text-selection'],

  mouseDown: function(evt) {
    if (!get(this, 'disableTextSelection')) {
      evt.preventDefault();
    }
  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get;

SC.TextSupport.reopen({
  /**
    @property {Boolean}
  */
  required: false,

  /**
    @property {Boolean}
  */
  readonly: false,

  /**
    @property {Boolean}
  */
  autofocus: false,

  /**
    @property {String}
   */
  tabindex: '1',

  /** @private */
  attributeBindings: ['required', 'readonly', 'autofocus', 'tabindex'],

  /**
    Give focus to the field
  */
  focus: function() {
    SC.run.schedule('render', this, function() {
      get(this, 'element').focus();
    });
  },

  /**
    Blur the field
  */
  blur: function() {
    SC.run.schedule('render', this, function() {
      get(this, 'element').blur();
    });
  }
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Strobe Inc. and contributors. ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var set = SC.set, get = SC.get;

/** 
  @class

  Overview
  ========

  UI.LayoutManager is an internal class used by UI.LayoutSupport to manage and
  update the layout of a view. The main API entry-points are: 
  layoutForManagedView(), and destroy(). The former returns a layout hash of
  properties to set on the view, and the latter cleans up the internal state
  of the layout manager.
  
  @private
  @extends SC.Object
 */
UI.LayoutManager = SC.Object.extend(
/** @scope UI.LayoutManager.prototype */{

  _direction: null,

  _anchors: null,
  _remainingSpace: null,

  _propertyMetadata: {
    remainingSpace: {
      neighbors: ['top','right','bottom','left']
    },
    top: {
      constraint: 'height',
      direction: 'vertical',
      neighbors: ['left','right']
    },
    right: {
      constraint: 'width',
      direction: 'horizontal',
      neighbors: ['top','bottom']
    },
    bottom: {
      constraint: 'height',
      direction: 'vertical',
      neighbors: ['left','right']
    },
    left: {
      constraint: 'width',
      direction: 'horizontal',
      neighbors: ['top','bottom']
    }
  },
  

  init: function() {
    this._anchors = {};
    return this._super();
  },

  layoutForManagedView: function(view, anchor, options) {
    if (anchor === 'remainingSpace') {
      return this._layoutForContentView(view, anchor, options);
    } else if (anchor) {
      return this._layoutForAnchoredView(view, anchor, options);
    }
    return null;
  },

  destroy: function() {
    this._direction = null;
    this._anchors = {};
    this._remainingSpace = null;
  },

  _layoutForAnchoredView: function(view, anchor, options) {
    var direction = this._direction,
        meta = this._propertyMetadata[anchor],
        neighbors = meta.neighbors,
        size = parseInt(options.size) + 'px',
        anchors = this._anchors,
        layout = {};

    if (direction !== null && direction !== meta.direction) { throw new SC.Error("You can't setup a horizontal anchor in a vertical view and vice versa."); }
    if (size === undefined || size === null) { throw new SC.Error("Anchors require a size property"); }

    layout[anchor] = 0;
    layout[meta.constraint] = size;

    for (var i=0,l=neighbors.length; i<l; i++) {
      var neighbor = neighbors[i];
      layout[neighbor] = 0;
    }

    this._direction = meta.direction;
    this._anchors[anchor] = {
      view: view,
      constraint: size
    };

    this._reflowContentView();

    return layout;
  },

  _layoutForContentView: function(view, anchor) {
    var direction = this._direction, anchors = this._anchors;
    var beforeAnchorName, afterAnchorName, beforeAnchor, afterAnchor;
    var remainingSpace = {
      view: view,
      before: null,
      after: null
    };

    if (direction === 'horizontal') {
      beforeAnchorName = 'left';
      afterAnchorName = 'right';
    }
    else if (direction === 'vertical') {
      beforeAnchorName = 'top';
      afterAnchorName = 'bottom';
    }

    beforeAnchor = anchors[beforeAnchorName];
    remainingSpace.before = beforeAnchor? beforeAnchor.constraint : 0;

    afterAnchor = anchors[afterAnchorName];
    remainingSpace.after = afterAnchor? afterAnchor.constraint : 0;

    this._remainingSpace = remainingSpace;

    var layout = {};
    var neighbors = this._propertyMetadata[anchor].neighbors;

    for (var i=0,l=neighbors.length; i<l; i++) {
      var neighbor = neighbors[i];
      layout[neighbor] = 0;
    }

    if (beforeAnchorName) {
      layout[beforeAnchorName] = remainingSpace.before;
    }
    if (afterAnchorName) {
      layout[afterAnchorName] = remainingSpace.after;
    }

    return layout;
  },

  _reflowContentView: function() {
    var remainingSpace = this._remainingSpace;

    if (!remainingSpace) { return; }
    else if (!remainingSpace.view) { return; }


    var layout = this._layoutForContentView(remainingSpace ,'remainingSpace');
    var element = get(remainingSpace.view,'element');

    if (element) {
      remainingSpace.view.applyLayout(layout);
    } else {
      SC.run.schedule('render', remainingSpace.view, 'applyLayout', layout);
    }
  }
});

UI.rootLayoutManager = UI.LayoutManager.create({});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

if ('Statechart' in SC) {
  
  SC.Statechart.reopen({
    send: SC.alias('sendAction')
  });

}

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Strobe Inc. and contributors. ©2011 Paul Chavard
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*
  TODO More docs for this class
*/

/**
  @class
  
  This is a simple undo manager.  To use this UndoManager, all you need to
  do is to make sure that you register a function with this manager to undo
  every change you make.  You can then invoke the undo/redo methods to do it.
  
  ## Using UI.UndoManager
  
  Typically you create an undo manager inside on of your controllers.  Then,
  whenever you are about to perform an action on your model object, all you
  need to do is to register a function with the undo manager that can undo 
  whatever  you just did.
  
  Besure the undo function you register also saves undo functions.  This makes
  redo possible.
  
  @extends SC.Object
*/
UI.UndoManager = SC.Object.extend({

  /** 
    Use this property to build your Undo menu name.
    
    @field
    @type String
    @default null
  */
  undoActionName: function() { 
    return this.undoStack ? this.undoStack.name : null;
  }.property('undoStack'),
  
  /** 
    Use this property to build your Redo menu name.
    
    @field
    @type String
    @default null
  */
  redoActionName: function() { 
    return this.redoStack ? this.redoStack.name : null;
  }.property('redoStack'),

  /** 
    True if there is an undo action on the stack.
    
    Use to validate your menu item.
    
    @field
    @type Boolean
    @default false
  */
  canUndo: function() { 
    // instead of this.undoStack !== null && this.undoStack !== undefined
    return this.undoStack != null;
  }.property('undoStack'),
  
  /** 
    True if there is an redo action on the stack. Use to validate your menu item.
    
    @field
    @type Boolean
    @default false
  */
  canRedo: function() { 
    // instead of this.redoStack !== null && this.redoStack !== undefined
    return this.redoStack != null; 
  }.property('redoStack'),
  
  /**
    Tries to undo the last action. Fails if an undo group is currently open.
    
    @returns {Boolean} true if suceeded, false otherwise.
  */
  undo: function() {
    this._undoOrRedo('undoStack', 'isUndoing');
  },
  
  /**
    Tries to redo the last action. Fails if a redo group is currently open.
    
    @returns {Boolean} true if suceeded, false otherwise.
  */
  redo: function() {
    this._undoOrRedo('redoStack', 'isRedoing');
  },
  
  /**
    @type Boolean
    @default false
  */
  isUndoing: false,
  
  /**
    @type Boolean
    @default false
  */
  isRedoing: false, 
  
  /** @private */
  groupingLevel: 0,
  
  // --------------------------------
  // SIMPLE REGISTRATION
  //
  // These are the core method to register undo/redo events.
  
  /**
    This is how you save new undo events.
    
    @param {Function} func A prebound function to be invoked when the undo executes.
    @param {String} [name] An optional name for the undo.  If you are using 
      groups, this is not necessary.
  */
  registerUndo: function(func, name) {
    this.beginUndoGroup(name);
    this._activeGroup.actions.push(func);
    this.endUndoGroup(name);
  },

  /**
    Begins a new undo groups

    Whenver you start an action that you expect to need to bundle under a single
    undo action in the menu, you should begin an undo group.  This way any
    undo actions registered by other parts of the application will be
    automatically bundled into this one action.
    
    When you are finished performing the action, balance this with a call to
    `endUndoGroup()`.
    
    @param {String} name
  */
  beginUndoGroup: function(name) {
    // is a group already active? Just increment the counter.
    if (this._activeGroup) {
      this.groupingLevel++;
    // otherwise, create a new active group.  
    } else {
      var stack = this.isUndoing ? 'redoStack' : 'undoStack';
      this._activeGroup = { name: name, actions: [], prev: this.get(stack) };
      this.set(stack, this._activeGroup);
      this.groupingLevel = 1;
    }
  },
 
  /**
    @param {String} name
    @see beginUndoGroup()

    @throws {Error} If there is no active group
  */
  endUndoGroup: function(name) {
    // if more than one groups are active, just decrement the counter.
    if (!this._activeGroup) raise("endUndoGroup() called outside group.");
    if (this.groupingLevel > 1) {
      this.groupingLevel-- ;
    // otherwise, close out the current group.
    } else {
      this._activeGroup = null;
      this.groupingLevel = 0;
    }
    this.propertyDidChange(this.isUndoing ? 'redoStack' : 'undoStack');
  },

  /**
    Change the name of the current undo group.
    
    Normally you don't want to do this as it will effect the whole group.
    
    @param {String} name

    @throws {Error} If there is no active group
  */
  setActionName: function(name) {
    if (!this._activeGroup) raise("setActionName() called outside group.");
    this._activeGroup.name = name;
  },
  
  // --------------------------------
  // PRIVATE
  //
  
  /** @private */
  _activeGroup: null,
  
  /** @private */
  undoStack: null,
  
  /** @private */
  redoStack: null, 
  
  /** @private */
  _undoOrRedo: function(stack, state) {
    if (this._activeGroup) return false;
    if (this.get(stack) == null) return true; // noting to do.

    this.set(state, true);
    var group = this.get(stack);
    this.set(stack, group.prev);
    var action;

    var useGroup = group.actions.length > 1; 
    if (useGroup) this.beginUndoGroup(group.name);
    while (action = group.actions.pop()) { action(); }
    if (useGroup) this.endUndoGroup(group.name);
    
    this.set(state, false);
  }
  
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = SC.get, set = SC.set, getPath = SC.getPath;
var URL = window['URL' || 'webkitURL'];

SC.BLANK_IMAGE_DATA_URL = "data:image/gif;base64,R0lGODlhAQABAJAAAP///wAAACH5BAUQAAAALAAAAAABAAEAAAICBAEAOw==";

/**
  @extends SC.View
*/
UI.ImageView = SC.View.extend({
  classNames: ['ui-image'],

  /**
   */
  useCanvas: true,

  /**
   */
  tagName: function() {
    return get(this, 'useCanvas') ? 'canvas' : 'img';
  }.property('useCanvas').cacheable(),

  /**
    Image source url

    @property {String}
  */
  src: null,

  /**
    Default image source url

    @property {String}
  */
  defaultImage: SC.BLANK_IMAGE_DATA_URL,

  /**

    @property {Boolean}
  */
  preserveAspectRatio: true,

  /**
    @property {Number}
  */
  height: null,

  /**
    @property {Number}
  */
  width: null,

  /**
    @property {String}
  */
  alt: null,

  /**
    @property {String}
   */
  ariaRole: 'img',

  /**
    @property {String}
  */
  status: 'none',

  attributeBindings: ['alt', 'width', 'height'],

  /**
    @property {File}
  */
  file: null,

  /**
    @property {Image}
   */
  image: new Image,

  /**
    Reset image src to default blank value
  */
  reset: function() {
    this._loadDefaultImage(get(this, 'defaultImage'));
    set(this, 'status', 'none');
  },

  /**
    Reset image src to default blank value
  */
  toDataURL: function(type) {
    if (!get(this, 'useCanvas')) {
      return false;
    }
    type = type || 'image/jpg';
    var context = get(this, 'element').getContext('2d');
    if (context.toDataURL) {
      return context.toDataURL(type);
    }
    return false;
  },

  /**
   *
   */
  didLoad: function() {
    this._renderImage();
    set(this, 'status', 'loaded');
  },

  /**
   *
   */
  didError: function() {
    this._loadDefaultImage(get(this, 'defaultImage'));
    set(this, 'status', 'failed');
  },

  /** @private */
  init: function() {
    this._super();
    var file = get(this, 'file');
    if (URL && file) {
      set(this, 'src', URL.createObjectURL(file));
    } else if (!get(this, 'src')) {
      set(this, 'src', SC.BLANK_IMAGE_DATA_URL);
    } else {
      this.propertyDidChange('src');
    }
    SC.run.schedule('render', this, function() {
      this.propertyDidChange('width');
      this.propertyDidChange('height');
    });
  },

  /** @private */
  destroy: function() {
    var file = get(this, 'file');
    if (URL && file) {
      URL.revokeObjectURL(file);
    }
    return this._super();
  },

  /** @private */
  didChangeSrc: function() {
    set(this, 'status', 'loading');
    SC.run.schedule('render', this, '_loadImage');
  }.observes('src'),

  /** @private */
  didChangeWidthHeight: function(view, key) {
    var w = get(this, 'width'),
        h = get(this, 'height'),
        ew = getPath(this, 'image.width'),
        eh = getPath(this, 'image.height'),
        par = get(this, 'preserveAspectRatio'),
        arw = (par && h) ? ew / (eh / h) : ew,
        arh = (par && w) ? eh / (ew / w) : eh;
    // if (w && h) {
    //   if (key === 'height') {
    //     h = null;
    //   } else {
    //     w = null;
    //   }
    // }
    if (w && key != 'width') {
      set(this, 'height', arh);
    } else {
      set(this, 'width', arw);
    }
    if (get(this, 'useCanvas')) {
      this._renderImage();
    }
  }.observes('width', 'height'),

  /** @private */
  _render: function() {
    return UI.ImageView.renders[(get(this, 'useCanvas') ? 'canvas' : 'image')];
  }.property('useCanvas').cacheable(),

  /** @private */
  _loadImage: function() {
    SC.$(get(this, 'image')).prop('src', get(this, 'src'))
      .load(SC.$.proxy(this, 'didLoad'))
      .bind('error abort', SC.$.proxy(this, 'didError'));
  },

  _renderImage: function(image) {
    get(this, '_render')(this, get(this, 'image'));
  },

  _loadDefaultImage: function(url) {
    var defaultImage = new Image;
    SC.$(defaultImage).prop('src', url)
      .load(SC.$.proxy(function() {
        get(this, '_render')(this, defaultImage);
        delete defaultImage;
      }, this))
      .bind('error abort', SC.$.proxy(function() {
        delete defaultImage;
      }, this));
  }
});

UI.ImageView.reopenClass({
  createFromFile: function(file) {
    return this.create({file: file});
  },
  createFromURL: function(url) {
    return this.create({src: url});
  }
});

UI.ImageView.renders = {
  image: function(view, image) {
    view.$().prop('src', image.src);
  },
  canvas: function(view, image) {
    var canvas = get(view, 'element'),
        canvasContext = canvas.getContext('2d');
    var w = parseInt(get(view, 'width')), h = parseInt(get(view, 'height'));
    canvasContext.clearRect(0, 0, w, h);
    canvasContext.drawImage(image, 0, 0, w, h);
  }
};

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



/**
  @extends SC.View
 */
UI.LabelView = SC.View.extend(UI.TextSelectionSupport, UI.TitleSupport, {
  tagName: 'span',
  classNames: ['ui-label'],
  defaultTemplate: SC.Handlebars.compile('{{{formattedTitle}}}')
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


var get = SC.get, set = SC.set, getPath = SC.getPath;

/**
  @extends SC.View
  UI.SelectableItemSupport
*/
UI.MenuItemView = SC.View.extend(UI.SelectableItemSupport, {
  tagName: 'li',
  classNames: ['ui-menu-item'],
  classNameBindings: ['selected', 'disabled'],

  click: function() {
    if (!get(this, 'disabled') && !getPath(this, 'collectionView.disabled')) {
      this.toggle();
    }
  }
});

/**
  @extends SC.CollectionView
  UI.SelectableSupport
*/
UI.MenuView = SC.CollectionView.extend(UI.SelectableSupport, {
  tagName: 'ul',
  classNames: ['ui-menu'],
  classNameBindings: ['multiple', 'disabled'],

  itemViewClass: UI.MenuItemView
});

})();
(function() {
// ==========================================================================
// Project:  SproutCore UI
// Copyright: ©2011 Paul Chavard and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================



var get = SC.get;

UI.View = SC.View.extend(UI.LayoutSupport, UI.AnimatableSupport);

SC.View.reopen({
  controllerView: function() {
    return this.nearestWithProperty('controller');
  }.property().cacheable(),

  targetView: function() {
    return this.nearestWithProperty('target');
  }.property().cacheable(),

  /**
    @private

    When the parent view changes, recursively invalidate
    targetView and controllerView
  */
  _controllerViewDidChange: function() {
    this.invokeRecursively(function(view) {
      view.propertyDidChange('targetView');
      view.propertyDidChange('controllerView');
    });
  }.observes('_parentView'),

  /**
    Replaces the view's element to the specified parent element.
    If the view does not have an HTML representation yet, `createElement()`
    will be called automatically.
    If the parent element already has some content, it will be removed.

    Note that this method just schedules the view to be appended; the DOM
    element will not be appended to the given element until all bindings have
    finished synchronizing

    @param {String|DOMElement|jQuery} A selector, element, HTML string, or jQuery object
    @returns {SC.View}
  */
  replaceIn: function(target) {
    this._insertElementLater(function() {
      SC.$(target).empty();
      this.$().appendTo(target);
    });

    return this;
  },

  isResponder: false
});

SC.$(document).bind('keyup keydown', function(evt) {
  $('.sc-view:visible').each(function(i, elem) {
    var view = SC.View.views[elem.id];
    if (view && get(view, 'isResponder')) {
      if (evt.type === 'keydown' && typeof view.keyDown === 'function') {
        view.keyDown(evt);
      } else if (typeof view.keyUp === 'function') {
        view.keyUp(evt);
      }
    }
  });
});

})();
