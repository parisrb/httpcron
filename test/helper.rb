ENV['RACK_ENV'] = 'test'
ENV['ENGINE'] = 'none'

require_relative '../httpcron'
require 'test/unit'
require 'rack/test'
require 'minitest/spec'
include Rack::Test::Methods

module Rack
  class MockResponse
    def json_body
      JSON.parse(body)
    end
  end
end


# Create another user and authenticate with its identity
# return the user id
def create_non_admin_user_authenticate
  post '/users', 'username' => 'testuser', 'password' => 'testpassword'
  id_user = last_response.json_body['id']
  digest_authorize 'testuser', 'testpassword'
  id_user
end

def authorize_admin
  digest_authorize 'httpcronadmin', 'httpcronadmin'
end

def create_valid_task
  post '/tasks', 'name' => 'test', 'url' => 'http://example.com', 'cron' => '0 0 1 1 *'
end

def create_valid_execution task_id, status = 200
  HTTPCron::Execution.create(:task_id => task_id,
                   :status => status,
                   :started_at => DateTime.now,
                   :duration => 2,
                   :response => '')
end

def last_response_id
  last_response.json_body['id']
end

def create_string length
  Array.new(length, 'a').join
end