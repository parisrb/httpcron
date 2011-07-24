class HTTPCronApi < Sinatra::Base

  get '/tasks' do
    content_type :json
    current_user.tasks.to_json
  end

  get '/tasks/:id/executions' do |id|
    t = Task.find(id)
    unless t.user.admin || t.user == current_user
      halt 403, 'This Task do not belongs to you!'
    end
    content_type :json
    t.executions.to_json
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

    create_task task
    content_type :json
    task.to_json
  end

  put '/tasks/:id' do |id|
    check_parameter_for_blank :name, :url, :cron

    if params[:timeout]
      if (timeout = params[:timeout].to_i) > HttpCronConfig.max_timeout
        halt 500, "Timeout [#{timeout}] can't be higher than #{HttpCronConfig.max_timeout}"
      end
    else
      timeout = HttpCronConfig.default_timeout
    end

    t = Task.find(id)
    unless t.user.admin || t.user == current_user
      halt 403, 'This Task do not belongs to you!'
    end
    t[:name] = params[:name]
    t[:url] = params[:url]
    t[:cron] = params[:cron]
    t[:enabled] = params[:enabled]
    t[:timeout] = timeout

    begin
      t.save
    rescue Exception => e
      halt 500, e.message
    end

    unless t.valid?
      halt 500, t.errors.values.join("\n")
    end

    content_type :json
    t.to_json
  end

  delete '/tasks/:id' do |id|
    t = Task.find(id)
    unless t.user.admin || t.user == current_user
      halt 403, 'This Task do not belongs to you!'
    end
    begin
      t.destroy
    rescue Exception => e
      halt 500, e.message
    end
    delete_task task
    halt 200
  end
end
