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
      last_response.json_body['total'].must_equal 2

      get '/users', 'limit' => '1'
      last_response.status.must_equal 200
      last_response.json_body['total'].must_equal 1
      last_response.json_body['records'][0]['username'].must_equal 'httpcronadmin'

      get '/users', 'limit' => '2'
      last_response.status.must_equal 200
      last_response.json_body['total'].must_equal 2

      raise(Sequel::Rollback)
    end
  end


end
