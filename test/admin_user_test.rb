require_relative 'helper'

describe 'user basics' do

  def app
    HTTPCronApi
  end

  before do
    authorize_admin
  end

  it 'has default user' do
    database.transaction do
      get '/users'
      last_response.status.must_equal 200
      last_response.json_body['total'].must_equal 1
      last_response.json_body['records'].length.must_equal 1
      last_response.json_body['records'][0]['username'].must_equal 'httpcronadmin'
      last_response.json_body['records'][0]['admin'].must_equal true
      raise(Sequel::Rollback)
    end
  end

  it 'can access your own user' do
    database.transaction do
      get '/users/current'
      last_response.status.must_equal 200
      last_response.json_body['username'].must_equal 'httpcronadmin'
      last_response.json_body['admin'].must_equal true
      raise(Sequel::Rollback)
    end
  end

end

describe 'user creation' do

  def app
    HTTPCronApi
  end

  before do
    digest_authorize 'httpcronadmin', 'httpcronadmin'
  end

  it 'can create user' do
    database.transaction do

      post '/users', 'username' => 'testuser', 'password' => 'testpassword'
      last_response.status.must_equal 200
      last_response.json_body['username'].must_equal 'testuser'
      last_response.json_body['password'].must_equal nil
      last_response.json_body['admin'].must_equal false

      get '/users'
      last_response.status.must_equal 200
      last_response.json_body['total'].must_equal 2

      raise(Sequel::Rollback)
    end
  end

  it 'requires a username' do
    database.transaction do
      post '/users', 'password' => 'testpassword'
      last_response.status.must_equal 422
      last_response.body.must_equal 'No [username] parameter'
      raise(Sequel::Rollback)
    end
  end

  it 'requires a password' do
    database.transaction do
      post '/users', 'username' => 'testuser'
      last_response.status.must_equal 422
      last_response.body.must_equal 'No [password] parameter'
      raise(Sequel::Rollback)
    end
  end

  it 'can delete a user' do
    database.transaction do
      post '/users', 'username' => 'testuser', 'password' => 'testpassword'
      user_id = last_response_id
      delete "/users/#{user_id}"
      last_response.status.must_equal 200
      raise(Sequel::Rollback)
    end
  end

end

describe 'access rights' do

  def app
    HTTPCronApi
  end

  before do
    digest_authorize 'httpcronadmin', 'httpcronadmin'
  end

  it 'cannot access other users' do
    database.transaction do
      get '/users/current'
      id_admin = last_response_id
      id_user = create_non_admin_user_authenticate

      get '/users'
      last_response.status.must_equal 403

      get "/users/#{id_admin}"
      last_response.status.must_equal 403

      get "/users/#{id_user}"
      last_response.status.must_equal 403

      get '/users/current'
      last_response.status.must_equal 200

      post '/users'
      last_response.status.must_equal 403

      raise(Sequel::Rollback)
    end
  end
end
