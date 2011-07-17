require_relative 'helper_test'

describe 'users administration' do

  def app
    HTTPCron
  end

  it 'has default user' do
    get '/users.json'
    database.transaction do
      last_response.code.should == 200
      last_response.json_body.length.should == 1
      last_response.json_body[0].username.should == 'httpcronadmin'
      last_response.json_body[0].admin.should == true
      raise(Sequel::Rollback)
    end
  end
end