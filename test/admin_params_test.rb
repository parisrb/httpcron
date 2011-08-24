require_relative 'helper'

describe 'params' do

  def app
    HTTPCronApi
  end

  before do
    authorize_admin
  end

  it 'uses limit' do
    database.transaction do
      post '/users', 'username' => 'testuser', 'password' => 'testpassword'

      get '/users'
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 2

      get '/users', :limit => 1
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 1
      last_response.json_body['records'][0]['username'].must_equal 'testuser'

      get '/users', :limit => 2
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 2

      get '/users', :limit => 3
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 2

      get '/users', :limit => HttpCronConfig.max_pagination_limit + 1
      last_response.status.must_equal 422

      get '/users', :limit => -1
      last_response.status.must_equal 422

      raise(Sequel::Rollback)
    end
  end

  it 'uses order' do
    database.transaction do
      post '/users', 'username' => 'testuser', 'password' => 'testpassword'

      get '/users', :order => 'id.desc'
      last_response.status.must_equal 200
      last_response.json_body['records'][0]['username'].must_equal 'testuser'

      get '/users', :order => 'id.asc'
      last_response.status.must_equal 200
      last_response.json_body['records'][0]['username'].must_equal 'httpcronadmin'

      get '/users', :order => 'id'
      last_response.status.must_equal 200
      last_response.json_body['records'][0]['username'].must_equal 'testuser'

      get '/users', :order => 'username.desc'
      last_response.status.must_equal 200
      last_response.json_body['records'][0]['username'].must_equal 'testuser'

      get '/users', :order => 'username.asc'
      last_response.status.must_equal 200
      last_response.json_body['records'][0]['username'].must_equal 'httpcronadmin'

      get '/users', :order => 'username'
      last_response.status.must_equal 200
      last_response.json_body['records'][0]['username'].must_equal 'testuser'

      get '/users', :order => 'wtf'
      last_response.status.must_equal 422

      get '/users', :order => 'username.wtf'
      last_response.status.must_equal 422

      raise(Sequel::Rollback)
    end
  end


  it 'uses page' do
    database.transaction do
      post '/users', 'username' => 'testuser', 'password' => 'testpassword'

      get '/users', :page => 0
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 2
      last_response.json_body['records'][0]['username'].must_equal 'testuser'

      get '/users', :page => 0, :limit => 1
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 1
      last_response.json_body['records'][0]['username'].must_equal 'testuser'

      get '/users', :page => 1, :limit => 1
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 1
      last_response.json_body['records'][0]['username'].must_equal 'httpcronadmin'

      get '/users', :page => 2, :limit => 1
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 0

      get '/users', :page => 1, :limit => 2
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 0

      raise(Sequel::Rollback)
    end
  end


end
