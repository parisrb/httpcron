require_relative 'helper_test'

describe 'tasks administration' do

  def app
    HTTPCron
  end

  it 'has no task by default' do
    database.transaction do
      get '/tasks.json'
      last_response.json_body.length.should == 0
      last_response.status.should == 200
      raise(Sequel::Rollback)
    end
  end

  it 'can create a task' do
    database.transaction do
      post '/tasks.json', 'user_id' => 1, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.should == 200
      last_response.json_body.id.should == 1
      raise(Sequel::Rollback)
    end
  end

  it 'requires a user id' do
    database.transaction do
      post '/tasks.json', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.should == 500
      last_response.body.should == 'No [user_id] parameter'
      raise(Sequel::Rollback)
    end
  end

  it 'requires a valid user id' do
    database.transaction do
      post '/tasks.json', 'user_id' => 2, 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
      last_response.status.should == 500
      last_response.body.should == 'User with id [2] not found'
      raise(Sequel::Rollback)
    end
  end

end