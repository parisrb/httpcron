require_relative 'helper'

describe 'admin task' do

  def app
    HTTPCron
  end

  it 'has no task by default' do
    database.transaction do
      get '/tasks.json'
      last_response.json_body.length.must_equal 0
      last_response.status.must_equal 200
      raise(Sequel::Rollback)
    end
  end

  it 'can create a task' do
    database.transaction do
      post '/tasks.json', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body.id.must_equal 1
      raise(Sequel::Rollback)
    end
  end

  it 'requires a user id' do
    database.transaction do
      post '/tasks.json', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 500
      last_response.body.must_equal 'No [user_id] parameter'
      raise(Sequel::Rollback)
    end
  end

  it 'requires a valid user id' do
    database.transaction do
      post '/tasks.json', 'user_id' => 2, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 500
      last_response.body.must_equal 'User with id [2] not found'
      raise(Sequel::Rollback)
    end
  end

  it 'requires a name' do
    database.transaction do
      post '/tasks.json', 'user_id' => 1, 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 500
      last_response.body.must_equal 'No [name] parameter'
      raise(Sequel::Rollback)
    end
  end

  it 'requires an url' do
    database.transaction do
      post '/tasks.json', 'user_id' => 1, 'name' => 'test', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 500
      last_response.body.must_equal 'No [url] parameter'
      raise(Sequel::Rollback)
    end
  end

  it 'requires a valid url' do
    database.transaction do

      buggy_url = 'http:|?example.com'
      post '/tasks.json', 'user_id' => 1, 'name' => 'test', 'url' => buggy_url, 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 500
      last_response.body.must_equal "[#{buggy_url}] is not a valid url"

      raise(Sequel::Rollback)
    end
  end

  it 'requires a cron' do
    database.transaction do

      post '/tasks.json', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com'
      last_response.status.must_equal 500
      last_response.body.must_equal 'No [cron] parameter'

      raise(Sequel::Rollback)
    end
  end

  it 'calculates the next execution' do
    database.transaction do

      post '/tasks.json', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body.next_execution.wont_be_nil

      raise(Sequel::Rollback)
    end
  end

  it 'can specify a timezone' do
    database.transaction do

      post '/tasks.json', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.must_equal 200
      last_response.json_body.timezone.must_equal 'UTC'

      raise(Sequel::Rollback)
    end
  end

end