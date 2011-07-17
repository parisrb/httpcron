class HTTPCron < Sinatra::Base

  get '/users.json' do
    content_type :json
    User.all.to_json
  end

end
