HC = SC.Application.create({
  panes: 'Login Tasks Executions Users'.w(),

  tasksOrderBy: [
    {
      title: 'Name',
      value: 'name'
    },
    {
      title: 'Enabled',
      value: 'enabled'
    },
    {
      title: 'Created At',
      value: 'created_at'
    },
    {
      title: 'Next Execution',
      value: 'next_execution'
    },
    {
      title: 'URL',
      value: 'url'
    }
  ],

  tasksInOrder: [
    {
      title: 'Ascending',
      value: 'asc'
    },
    {
      title: 'Descending',
      value: 'desc'
    }
  ]
});

HC.createPanes(HC.panes);

//name, :url, :timeout, :enabled, :cron, :timezone, :next_execution, :created_at, :updated_at
