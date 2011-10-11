module HTTPCron

  class ApiServer < Sinatra::Base

    get /\/executions\/(\d+)/ do |id|
      execution = execution_if_allowed(id)
      content_type :json
      execution.to_json
    end

    EXECUTIONS_LIST_ORDER_FIELDS = [:id, :status, :started_at, :duration]
    EXECUTIONS_LIST_ORDER_REGEX = create_order_regex(EXECUTIONS_LIST_ORDER_FIELDS)

    get /\/executions\/task\/(\d+)\/failure/ do |id|
      task = task_if_allowed(id)
      apply_list_params_executions(apply_failure_execution_filter(Execution.filter(:task => task)))
    end

    get /\/executions\/task\/(\d+)\/success/ do |id|
      task = task_if_allowed(id)
      apply_list_params_executions(apply_successful_execution_filter(Execution.filter(:task => task)))
    end

    get /\/executions\/task\/(\d+)/ do |id|
      task = task_if_allowed(id)
      apply_list_params_executions(Execution.filter(:task => task))
    end

    get /\/executions\/user\/(\d+)\/failure/ do |id|
      check_admin || current_user.id == id
      apply_list_params_executions(apply_failure_execution_filter(Execution.filter('task_id in (select task_id from tasks where user_id = ?)', id)))
    end

    get /\/executions\/user\/(\d+)\/success/ do |id|
      check_admin || current_user.id == id
      apply_list_params_executions(apply_successful_execution_filter(Execution.filter('task_id in (select task_id from tasks where user_id = ?)', id)))
    end

    get /\/executions\/user\/(\d+)/ do |id|
      check_admin || current_user.id == id
      apply_list_params_executions(Execution.filter('task_id in (select task_id from tasks where user_id = ?)', id))
    end

    get /\/executions\/user\/current\/failure/ do
      apply_list_params_executions(apply_failure_execution_filter(Execution.filter('task_id in (select task_id from tasks where user_id = ?)', current_user.id)))
    end

    get /\/executions\/user\/current\/success/ do
      apply_list_params_executions(apply_successful_execution_filter(Execution.filter('task_id in (select task_id from tasks where user_id = ?)', current_user.id)))
    end

    get /\/executions\/user/ do
      apply_list_params_executions(Execution.filter('task_id in (select task_id from tasks where user_id = ?)', current_user.id))
    end

    delete /\/executions\/(\d+)/ do |id|
      execution = execution_if_allowed(id)

      begin
        execution.destroy
      rescue Exception => e
        halt 500, e.message
      end
      halt 200, "Execution [#{id}] deleted"
    end

    helpers do

      def apply_successful_execution_filter dataset
        dataset.filter(:status => 200..210)
      end

      def apply_failure_execution_filter dataset
        dataset.filter(~{:status => 200..210})
      end

      def apply_list_params_executions dataset
        apply_list_params(dataset, EXECUTIONS_LIST_ORDER_FIELDS, EXECUTIONS_LIST_ORDER_REGEX)
      end

      def execution_if_allowed id
        execution = Execution[id]
        if !execution
          halt 404, "execution [#{id}] not found"
        elsif (execution.task.user != current_user) && (!current_user.admin)
          halt 403, "execution [#{id}] is not allowed to you"
        else
          execution
        end
      end

    end

  end

end