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
    authorize_admin
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

  it 'check for duplicates' do
    database.transaction do

      post '/users', 'username' => 'testuser', 'password' => 'testpassword'
      post '/users', 'username' => 'testuser', 'password' => 'testpassword'
      last_response.status.must_equal 422
      last_response.body.must_equal 'username is already taken'
      raise(Sequel::Rollback)
    end
  end

  it 'requires a username' do
    database.transaction do
      post '/users', 'password' => 'testpassword'
      last_response.status.must_equal 422
      last_response.body.must_equal 'username is missing'
      raise(Sequel::Rollback)
    end
  end

  it 'requires a not too long username' do
    database.transaction do
      post '/users', 'username' => create_string(255), 'password' => 'testpassword'
      last_response.status.must_equal 422
      last_response.body.must_equal 'username is longer than 250 characters'
      raise(Sequel::Rollback)
    end
  end

  it 'requires a password' do
    database.transaction do
      post '/users', 'username' => 'testuser'
      last_response.status.must_equal 422
      last_response.body.must_equal 'password is missing'
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

describe 'user edition' do

  def app
    HTTPCronApi
  end

  before do
    authorize_admin
  end

  it 'can edit user' do
    database.transaction do

      post '/users', 'username' => 'testuser', 'password' => 'testpassword'
      last_response.status.must_equal 200
      user_id = last_response_id

      put "/users/#{user_id}", 'username' => 'testuser2', 'password' => 'testpassword'
      last_response.status.must_equal 200
      last_response.json_body['username'].must_equal 'testuser2'

      raise(Sequel::Rollback)
    end
  end

  it 'requires a password when changing the username' do
    database.transaction do

      post '/users', 'username' => 'testuser', 'password' => 'testpassword'
      last_response.status.must_equal 200
      user_id = last_response_id

      put "/users/#{user_id}", 'username' => 'testuser'
      last_response.status.must_equal 200

      put "/users/#{user_id}", 'username' => 'testuser2'
      last_response.status.must_equal 400
      last_response.body.must_equal 'can\'t change the username without changing the password'

      raise(Sequel::Rollback)
    end
  end

  it 'can edit it\s own user' do
    database.transaction do

      create_non_admin_user_authenticate
      last_response.status.must_equal 200
      user_id = last_response_id

      put "/users/#{user_id}", 'username' => 'testuser2', 'password' => 'testpassword'
      last_response.status.must_equal 200
      last_response.json_body['username'].must_equal 'testuser2'

      get '/users/current'
      last_response.status.must_equal 401

      digest_authorize 'testuser2', 'testpassword'
      get '/users/current'
      last_response.status.must_equal 200

      put "/users/#{user_id}", 'admin' => 'false'
      last_response.status.must_equal 200

      put "/users/#{user_id}", 'admin' => 'true'
      last_response.status.must_equal 403

      raise(Sequel::Rollback)
    end
  end

  it 'cannot edit other users if not admin' do
    database.transaction do

      get '/users/current'
      user_id = last_response_id
      create_non_admin_user_authenticate

      put "/users/#{user_id}", 'username' => 'testuser2', 'password' => 'testpassword'
      last_response.status.must_equal 403
      last_response.body.must_equal "user [#{user_id}] is not allowed to you"

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
