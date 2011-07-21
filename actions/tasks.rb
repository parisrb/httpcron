class HTTPCronApi < Sinatra::Base

  get '/tasks' do
    content_type :json
    current_user.tasks.to_json
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

    t = Task.new(:user => current_user,
                 :name => params[:name],
                 :url => params[:url],
                 :cron => params[:cron],
                 :timezone => (params[:timezone] || current_user.timezone),
                 :enabled => (params[:enabled] || true),
                 :timeout => timeout)

    unless t.valid?
      halt 500, t.errors.values.join("\n")
    end

    begin
      t.save
    rescue Exception => e
      halt 500, e.message
    end

    update_task t
    content_type :json
    t.to_json
  end

  delete '/tasks/:id' do |id|
    task = Task.find(id)
    begin
      task.destroy
    rescue Exception => e
      halt 500, e.message
    end
    halt 200
  end
end
