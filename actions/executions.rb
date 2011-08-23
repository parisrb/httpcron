class HTTPCronApi < Sinatra::Base

  get '/executions/:id' do |id|
    execution = execution_if_allowed(id)
    content_type :json
    execution.to_json
  end

  EXECUTIONS_LIST_ORDER_FIELDS = [:id, :status, :run_at, :duration]
  EXECUTIONS_LIST_ORDER_REGEX = create_order_regex(EXECUTIONS_LIST_ORDER_FIELDS)

  get '/executions/task/:id' do |id|
    task = task_if_allowed(id)
    apply_list_params(Execution.filter(:task => task), EXECUTIONS_LIST_ORDER_FIELDS, EXECUTIONS_LIST_ORDER_REGEX)
  end

  delete '/executions/:id' do |id|
    execution = execution_if_allowed(id)

    begin
      execution.destroy
    rescue Exception => e
      halt 500, e.message
    end
    halt 200, "Execution [#{id}] deleted"
  end

  def execution_if_allowed id
    execution = Execution[id]
    if !execution
      halt 404, "Execution [#{id}] not found"
    elsif (execution.user != current_user) && (!current_user.admin)
      halt 403, "Execution [#{id}] is not allowed to you"
    else
      execution
    end
  end

end
