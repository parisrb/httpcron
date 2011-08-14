
HttpCron.PreviousButton = JUI.Button.extend({
  label: "Previous",
  action: 'previousPage',
  isVisibleBinding: 'targetObject.hasPreviousPage',
  disabledBinding: 'targetObject.isLoading'
});

HttpCron.NextButton = JUI.Button.extend({
  label: "Next",
  action: 'nextPage',
  isVisibleBinding: 'targetObject.hasNextPage',
  disabledBinding: 'targetObject.isLoading'
});
