// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// pagination_buton.js
// ==========================================================================
SB = this.SB || {};

SB.PreviousButton = UI.Button.extend({
  title: "Previous",
  action: 'previousPage',
  isVisibleBinding: 'targetObject.hasPreviousPage',
  disabledBinding: 'targetObject.isLoading'
});

SB.NextButton = UI.Button.extend({
  title: "Next",
  action: 'nextPage',
  isVisibleBinding: 'targetObject.hasNextPage',
  disabledBinding: 'targetObject.isLoading'
});
