require_relative 'helper'

describe 'task edition' do

  def app
    HTTPCronApi
  end

  before do
    authorize_admin
  end

  it 'has no task by default' do
    database.transaction do
      get '/tasks'
      last_response.json_body['total'].must_equal 0
      last_response.status.must_equal 200
      raise(Sequel::Rollback)
    end
  end

  it 'can create a task' do
    database.transaction do
      create_valid_task
      last_response.status.must_equal 200
      last_response_id.must_equal 1
      raise(Sequel::Rollback)
    end
  end

  it 'can edit a task' do
    database.transaction do
      create_valid_task
      task_id = last_response_id
      put "/tasks/#{task_id}", 'name' => 'test2'
      last_response.status.must_equal 200
      last_response_id.must_equal 1
      last_response.json_body['name'].must_equal 'test2'
      raise(Sequel::Rollback)
    end
  end

  it 'can delete a task' do
    database.transaction do
      create_valid_task
      delete "/tasks/#{last_response_id}"
      last_response.status.must_equal 200
      raise(Sequel::Rollback)
    end
  end

  it 'can fetch a task' do
    database.transaction do
      create_valid_task
      create_valid_task
      create_valid_task
      last_id = last_response_id

      get "/tasks/#{last_id}"
      last_response.status.must_equal 200
      last_response_id.must_equal last_id
      raise(Sequel::Rollback)
    end
  end

  it 'requires a name' do
    database.transaction do

      post '/tasks', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 422
      last_response.body.must_equal 'name is missing'

      post '/tasks', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'name' => ''
      last_response.status.must_equal 422
      last_response.body.must_equal 'name is blank'

      create_valid_task
      put "/tasks/#{last_response_id}", 'name' => ''
      last_response.status.must_equal 422
      last_response.body.must_equal 'name is blank'

      raise(Sequel::Rollback)
    end
  end

  it 'requires an url' do
    database.transaction do

      post '/tasks', 'name' => 'test', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 422
      last_response.body.must_equal 'url is missing'

      post '/tasks', 'name' => 'test', 'cron' => '0 0 1 1 *', 'url' => ''
      last_response.status.must_equal 422
      last_response.body.must_equal 'url is blank'

      create_valid_task
      put "/tasks/#{last_response_id}", 'url' => ''
      last_response.status.must_equal 422
      last_response.body.must_equal 'url is blank'

      raise(Sequel::Rollback)
    end
  end

  it 'requires a valid url' do
    database.transaction do

      buggy_url = 'http:|?example.com'
      post '/tasks', 'name' => 'test', 'url' => buggy_url, 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 422
      last_response.body.must_equal "url [#{buggy_url}] is invalid"

      create_valid_task
      put "/tasks/#{last_response_id}", 'url' => buggy_url
      last_response.status.must_equal 422
      last_response.body.must_equal "url [#{buggy_url}] is invalid"

      raise(Sequel::Rollback)
    end
  end

  it 'requires a cron' do
    database.transaction do

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com'
      last_response.status.must_equal 422
      last_response.body.must_equal 'cron is missing'

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => ''
      last_response.status.must_equal 422
      last_response.body.must_equal 'cron is blank'

      create_valid_task
      put "/tasks/#{last_response_id}", 'cron' => ''
      last_response.status.must_equal 422
      last_response.body.must_equal 'cron is blank'

      raise(Sequel::Rollback)
    end
  end

  it 'requires a valid cron' do
    database.transaction do

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => 'wtf ??'
      last_response.status.must_equal 422
      last_response.body.must_equal 'cron [wtf ??] is invalid'

      create_valid_task
      put "/tasks/#{last_response_id}", 'cron' => 'wtf ??'
      last_response.status.must_equal 422
      last_response.body.must_equal 'cron [wtf ??] is invalid'

      raise(Sequel::Rollback)
    end
  end

  it 'calculates the next execution' do
    database.transaction do

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body['next_execution'].wont_be_nil

      raise(Sequel::Rollback)
    end
  end

  it 'can specify a timezone' do
    database.transaction do

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body['timezone'].must_equal HttpCronConfig.server_timezone

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'timezone' => 'Atlantic/Bermuda'
      last_response.status.must_equal 200
      last_response.json_body['timezone'].must_equal 'Atlantic/Bermuda'

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'timezone' => 'Mordor'
      last_response.status.must_equal 422
      last_response.body.must_equal 'timezone [Mordor] is invalid'

      create_valid_task
      put "/tasks/#{last_response_id}", 'timezone' => 'Mordor'
      last_response.status.must_equal 422
      last_response.body.must_equal 'timezone [Mordor] is invalid'

      raise(Sequel::Rollback)
    end
  end

  it 'can specify if task is enabled' do
    database.transaction do

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body['enabled'].must_equal true

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'enabled' => true
      last_response.status.must_equal 200
      last_response.json_body['enabled'].must_equal true

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'enabled' => false
      last_response.status.must_equal 200
      last_response.json_body['enabled'].must_equal false

      raise(Sequel::Rollback)
    end
  end

  it 'can specify a timeout' do
    database.transaction do

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body['timeout'].must_equal HttpCronConfig.default_timeout

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'timeout' => 13
      last_response.status.must_equal 200
      last_response.json_body['timeout'].must_equal 13

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'timeout' => 50000
      last_response.status.must_equal 422
      last_response.body.must_equal 'timeout [50000] can\'t be higher than 300'

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'timeout' => 'wtf ??'
      last_response.status.must_equal 422
      last_response.body.must_equal '[wtf ??] is not a valid timeout'

      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'timeout' => -200
      last_response.status.must_equal 422
      last_response.body.must_equal 'timeout [-200] should be > 0'

      create_valid_task
      task_id =  last_response_id

      put "/tasks/#{task_id}", 'timeout' => 50000
      last_response.status.must_equal 422
      last_response.body.must_equal 'timeout [50000] can\'t be higher than 300'

      put "/tasks/#{task_id}", 'timeout' => 'wtf ??'
      last_response.status.must_equal 422
      last_response.body.must_equal '[wtf ??] is not a valid timeout'

      put "/tasks/#{task_id}", 'timeout' => -200
      last_response.status.must_equal 422
      last_response.body.must_equal 'timeout [-200] should be > 0'

      raise(Sequel::Rollback)
    end
  end

  it 'has length limit' do
    post '/tasks', 'name' => create_string(255), 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
    last_response.status.must_equal 422
    last_response.body.must_equal 'name is longer than 250 characters'

    post '/tasks', 'name' => 'test', 'url' => create_string(256), 'cron' => '0 0 1 1 *'
    last_response.status.must_equal 422
    last_response.body.must_equal 'url is longer than 255 characters'
  end

end

describe 'task access rights' do

  def app
    HTTPCronApi
  end

  before do
    authorize_admin
  end

  it 'admin can see tasks of other users' do
    database.transaction do
      create_non_admin_user_authenticate
      create_valid_task
      task_id = last_response_id
      authorize_admin
      get "/tasks/#{task_id}"
      last_response.status.must_equal 200
      raise(Sequel::Rollback)
    end
  end

  it 'non admin user can\'t see tasks of other users' do
    database.transaction do
      create_valid_task
      task_id = last_response_id
      create_non_admin_user_authenticate
      get "/tasks/#{task_id}"
      last_response.status.must_equal 403
      raise(Sequel::Rollback)
    end
  end

  it 'only the user tasks are listed' do
    database.transaction do
      create_valid_task
      create_non_admin_user_authenticate
      get '/tasks'
      last_response.status.must_equal 200
      last_response.json_body['total'].must_equal 0
      raise(Sequel::Rollback)
    end
  end

  it 'can only delete its own tasks' do
    database.transaction do
      create_valid_task
      task_id = last_response_id
      create_non_admin_user_authenticate
      delete "/tasks/#{task_id}"
      last_response.status.must_equal 403
      raise(Sequel::Rollback)
    end
  end

  it 'admin can delete all tasks' do
    database.transaction do
      create_non_admin_user_authenticate
      create_valid_task
      task_id = last_response_id
      authorize_admin
      delete "/tasks/#{task_id}"
      last_response.status.must_equal 200
      raise(Sequel::Rollback)
    end
  end

  it 'can only edit its own tasks' do
    database.transaction do
      create_valid_task
      task_id = last_response_id
      create_non_admin_user_authenticate
      put "/tasks/#{task_id}"
      last_response.status.must_equal 403
      raise(Sequel::Rollback)
    end
  end

  it 'admin can edit all tasks' do
    database.transaction do
      create_non_admin_user_authenticate
      create_valid_task
      task_id = last_response_id
      authorize_admin
      put "/tasks/#{task_id}"
      last_response.status.must_equal 200
      raise(Sequel::Rollback)
    end
  end


end
