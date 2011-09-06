class HTTPCronApi < Sinatra::Base

  get '/tasks' do
    tasks_for_user current_user
  end

  get /\/tasks\/(\d+)/ do |id|
    task = task_if_allowed(id)

    content_type :json
    task.to_json
  end

  get /\/tasks\/users\/(\d+)/ do |id|
    check_admin

    user = User[id]
    unless user
      halt 404, "User [#{id}] not found"
    end

    tasks_for_user user
  end

  post '/tasks' do
    check_parameter_for_blank :name, :url, :cron

    if params[:timeout]
      begin
        Kernel.Integer(params[:timeout])
      rescue
        halt 422, "[#{params[:timeout]}] is not a valid timeout"
      end

      if (timeout = params[:timeout].to_i) > HttpCronConfig.max_timeout
        halt 422, "timeout [#{timeout}] can't be higher than #{HttpCronConfig.max_timeout}"
      end
    else
      timeout = HttpCronConfig.default_timeout
    end

    task = Task.new
    task.user = current_user
    task.name = params[:name]
    task.url = params[:url]
    task.cron = params[:cron]
    task.timezone = params[:timezone] || current_user.timezone
    task.enabled = params[:enabled] || true
    task.timeout = timeout

    save_task task
  end

  put /\/tasks\/(\d+)/ do |id|
    task = task_if_allowed(id)

    if params[:timeout]
      timeout = params[:timeout]
      begin
        Kernel.Integer(timeout)
      rescue
        halt 422, "[#{timeout}] is not a valid timeout"
      end

      if (timeout = timeout.to_i) > HttpCronConfig.max_timeout
        halt 422, "timeout [#{timeout}] can't be higher than #{HttpCronConfig.max_timeout}"
      else
        task.timeout = timeout
      end
    end

    [:name, :url, :cron, :enabled, :timezone].each do |s|
      if params[s]
        if params[s].blank?
          halt 422, "#{s} is blank"
        else
          task[s] = params[s]
        end
      end
    end

    unless params.has_key? :enabled
      task.enabled = true
    end

    save_task task
  end

  delete /\/tasks\/(\d+)/ do |id|
    task = task_if_allowed(id)
    begin
      task.destroy
    rescue Exception => e
      halt 500, e.message
    end
    content_type :json
    halt 200
  end

  private

  def task_if_allowed id
    task = Task[id]
    if !task
      halt 404, "task [#{id}] does not exist"
    elsif (task.user != current_user) && (!current_user.admin)
      halt 403, "task [#{id}] is not allowed to you"
    else
      task
    end
  end

  TASKS_LIST_ORDER_FIELDS = [:id, :name, :url, :timeout, :enabled, :cron, :timezone, :next_execution, :created_at, :updated_at]
  TASKS_LIST_ORDER_REGEX = create_order_regex(TASKS_LIST_ORDER_FIELDS)

  def tasks_for_user user
    apply_list_params(Task.filter(:user => user), TASKS_LIST_ORDER_FIELDS, TASKS_LIST_ORDER_REGEX)
  end

  def save_task task
    unless task.valid?
      halt 422, task.errors.full_messages.join("\n")
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

end
