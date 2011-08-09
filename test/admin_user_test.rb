require_relative 'helper'

describe 'admin user' do

  def app
    HTTPCronApi
  end

  before do
     digest_authorize 'httpcronadmin', 'httpcronadmin'
  end

  it 'has default user' do
    get '/users'
    database.transaction do
      last_response.status.must_equal 200
      last_response.json_body['total'].must_equal 1
      last_response.json_body['users'].length.must_equal 1
      last_response.json_body['users'][0].username.must_equal 'httpcronadmin'
      last_response.json_body['users'][0].admin.must_equal true
      raise(Sequel::Rollback)
    end
  end

  it 'can create user' do
    database.transaction do
      post '/users', 'username' => 'testuser', 'password' => 'testpassword'
      last_response.status.must_equal 200
      last_response.json_body.username.must_equal 'testuser'
      last_response.json_body.password.must_equal nil
      last_response.json_body.admin.must_equal false
      raise(Sequel::Rollback)
    end
  end

  it 'can delete a user' do
    database.transaction do
      post '/users', 'username' => 'testuser', 'password' => 'testpassword'
      user_id = last_response.json_body.id
      delete "/users/#{user_id}"
      last_response.status.must_equal 200
      last_response.body.must_equal "User [#{user_id}] deleted"
      raise(Sequel::Rollback)
    end
  end
end
