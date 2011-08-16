require_relative 'helper'

describe 'admin task' do

  def app
    HTTPCronApi
  end

  before do
     digest_authorize 'httpcronadmin', 'httpcronadmin'
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
      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body['id'].must_equal 1
      raise(Sequel::Rollback)
    end
  end

  it 'can delete a task' do
    database.transaction do
      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      delete "/tasks/#{last_response.json_body['id']}"
      last_response.status.must_equal 200
      raise(Sequel::Rollback)
    end
  end

  it 'can fetch a task' do
    database.transaction do
      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      get "/tasks/4"
      last_response.status.must_equal 200
      last_response.json_body['id'].must_equal 4
      raise(Sequel::Rollback)
    end
  end

  it 'requires a name' do
    database.transaction do
      post '/tasks', 'user_id' => 1, 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 422
      last_response.body.must_equal 'No [name] parameter'
      raise(Sequel::Rollback)
    end
  end

  it 'requires an url' do
    database.transaction do
      post '/tasks', 'user_id' => 1, 'name' => 'test', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 422
      last_response.body.must_equal 'No [url] parameter'
      raise(Sequel::Rollback)
    end
  end

  it 'requires a valid url' do
    database.transaction do

      buggy_url = 'http:|?example.com'
      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => buggy_url, 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 422
      last_response.body.must_equal "[#{buggy_url}] is not a valid url"

      raise(Sequel::Rollback)
    end
  end

  it 'requires a cron' do
    database.transaction do

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com'
      last_response.status.must_equal 422
      last_response.body.must_equal 'No [cron] parameter'

      raise(Sequel::Rollback)
    end
  end

  it 'requires a valid cron' do
    database.transaction do

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => 'wft ??'
      last_response.status.must_equal 422
      last_response.body.must_equal "not a valid cronline : 'wft ?? UTC'"

      raise(Sequel::Rollback)
    end
  end

  it 'calculates the next execution' do
    database.transaction do

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body['next_execution'].wont_be_nil

      raise(Sequel::Rollback)
    end
  end

  it 'can specify a timezone' do
    database.transaction do

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body['timezone'].must_equal HttpCronConfig.server_timezone

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'timezone' => 'Atlantic/Bermuda'
      last_response.status.must_equal 200
      last_response.json_body['timezone'].must_equal 'Atlantic/Bermuda'

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'timezone' => 'Mordor'
      last_response.status.must_equal 422
      last_response.body.must_equal '[Mordor] is not a valid timezone'

      raise(Sequel::Rollback)
    end
  end

  it 'can specify if task is enabled' do
    database.transaction do

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body['enabled'].must_equal true

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'enabled' => true
      last_response.status.must_equal 200
      last_response.json_body['enabled'].must_equal true

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'enabled' => false
      last_response.status.must_equal 200
      last_response.json_body['enabled'].must_equal false

      raise(Sequel::Rollback)
    end
  end

  it 'can specify a timeout' do
    database.transaction do

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body['timeout'].must_equal HttpCronConfig.default_timeout

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'timeout' => 13
      last_response.status.must_equal 200
      last_response.json_body['timeout'].must_equal 13

      post '/tasks', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *', 'timeout' => 50000
      last_response.status.must_equal 422
      last_response.body.must_equal 'Timeout [50000] can\'t be higher than 300'

      raise(Sequel::Rollback)
    end
  end

end
