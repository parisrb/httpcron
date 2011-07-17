require_relative 'helper'

describe 'admin user' do

  def app
    HTTPCron
  end

  it 'has default user' do
    get '/users.json'
    database.transaction do
      last_response.status.must_equal 200
      last_response.json_body.length.must_equal 1
      last_response.json_body[0].username.must_equal 'httpcronadmin'
      last_response.json_body[0].admin.must_equal true
      raise(Sequel::Rollback)
    end
  end
end