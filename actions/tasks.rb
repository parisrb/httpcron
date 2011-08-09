class HTTPCronApi < Sinatra::Base

  get '/tasks' do
    content_type :json
    current_user.tasks.to_json
  end

  get '/tasks/:id' do |id|
    task = task_if_allowed(id)

    content_type :json
    task.to_json
  end

  get '/tasks/user/:id' do |id|
    check_admin

    user = User.find(id)
    unless user
      halt 404, "User [#{id}] not found"
    end
    content_type :json
    user.task.to_json
  end

  post '/tasks' do
    check_parameter_for_blank :name, :url, :cron

    if params[:timeout]
      if (timeout = params[:timeout].to_i) > HttpCronConfig.max_timeout
        halt 500, "Timeout [#{timeout}] can't be higher than #{HttpCronConfig.max_timeout}"
      end
    else
      timeout = HttpCronConfig.default_timeout
    end

    task = Task.new(:user => current_user,
                    :name => params[:name],
                    :url => params[:url],
                    :cron => params[:cron],
                    :timezone => (params[:timezone] || current_user.timezone),
                    :enabled => (params[:enabled] || true),
                    :timeout => timeout)

    unless task.valid?
      halt 500, task.errors.values.join("\n")
    end

    begin
      task.save
    rescue Exception => e
      halt 500, e.message
    end

    notify_create_task task
    content_type :json
    task.to_json
  end

  put '/tasks/:id' do |id|
    task = task_if_allowed(id)

    check_parameter_for_blank :name, :url, :cron

    if params[:timeout]
      if (timeout = params[:timeout].to_i) > HttpCronConfig.max_timeout
        halt 500, "Timeout [#{timeout}] can't be higher than #{HttpCronConfig.max_timeout}"
      end
    else
      timeout = HttpCronConfig.default_timeout
    end

    [:name, :url, :cron, :enabled].each do |s|
      task[s] = params[s]
    end
    task[:timeout] = timeout

    unless task.valid?
      halt 500, task.errors.values.join("\n")
    end

    begin
      task.save
    rescue Exception => e
      halt 500, e.message
    end

    notify_update_task task

    content_type :json
    task.to_json
  end

  delete '/tasks/:id' do |id|
    task = task_if_allowed(id)

    begin
      task.destroy
    rescue Exception => e
      halt 500, e.message
    end
    notify_delete_task task
    halt 200, "Task [#{id}] deleted"
  end

  def task_if_allowed id
    task = Task.find(id)
    if !task
      halt 500, "Task [#{id}] does not exist"
    elsif (task.user != current_user) && (!current_user.admin)
      halt 403, "Task [#{id}] is not allowed to you"
    else
      task
    end
  end

end
