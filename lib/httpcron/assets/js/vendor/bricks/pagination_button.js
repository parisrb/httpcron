// ==========================================================================
// Project:   SproutCore Bricks
// Copyright: ©2011 Paul Chavard
// Author :   Paul Chavard
//
// pagination_buton.js
// ==========================================================================
SB = this.SB || {};

SB.PreviousButton = SC.Button.extend({
  title: "Previous",
  action: 'previousPage',
  isVisibleBinding: 'targetObject.hasPreviousPage',
  disabledBinding: 'targetObject.isLoading'
});

SB.NextButton = SC.Button.extend({
  title: "Next",
  action: 'nextPage',
  isVisibleBinding: 'targetObject.hasNextPage',
  disabledBinding: 'targetObject.isLoading'
});
