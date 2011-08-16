class HTTPCronApi < Sinatra::Base

  get '/executions/:id' do |id|
    execution = execution_if_allowed(id)

    content_type :json
    execution.to_json
  end

  get '/executions/task/:id' do |id|
    task = task_if_allowed(id)

    pagination_params
    content_type :json

    executions = Execution.order(:id).filter(:task => task).paginate(@offset, @limit)
    {:total => executions.pagination_record_count, :records => executions}.to_json
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
    execution = Execution.find(id)
    if !execution
      halt 404, "Execution [#{id}] not found"
    elsif (execution.user != current_user) && (!current_user.admin)
      halt 403, "Execution [#{id}] is not allowed to you"
    else
      execution
    end
  end

end
