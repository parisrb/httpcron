unless 'test' == ENV['RACK_ENV']
  module Rack
    module Auth
      class AbstractHandler
        private
        def unauthorized(www_authenticate = challenge)
          return [ 401,
                  {'Content-Type' => 'text/plain',
                   'Content-Length' => '0',
                   'X-WWW-Authenticate' => www_authenticate.to_s},
                  []
          ]
        end
      end
    end
  end
end

class HTTPCronApi < Sinatra::Base

  before do
    digest_header = @env['HTTP_AUTHORIZATION']
    tokens = digest_header.gsub('Digest', '').split(',')
    username = tokens.detect do |token|
      token.match(/^\s?username/)
    end
    if username
      username = username.split('=').pop.gsub('"', '')
      self.current_user = User.filter(:username => username).first
    end
  end

  get '/users' do
    check_admin
    content_type :json
    User.all.to_json
  end

  get '/users/current' do
    content_type :json
    current_user.to_json
  end

  get '/users/:id' do |id|
    check_admin
    if current_user.id != id
      user = User.find(id)
      unless user
        halt 404, "User [#{id}] does not exist"
      end
      content_type :json
      user.to_json
    else
      content_type :json
      current_user.to_json
    end

  end

  post '/users' do
    check_admin
    user = User.new(:username => params[:username],
                    :admin => 'true' == params[:admin],
                    :timezone => (params[:timezone] || HttpCronConfig.server_timezone),
                    :password => params[:password])

    unless user.valid?
      halt 500, user.errors.values.join("\n")
    end

    begin
      user.save
    rescue Exception => e
      halt 500, e.message
    end

    content_type :json
    user.to_json
  end

  delete '/users/:id' do |id|
    check_admin || current_user.id == id
    user = User.find(id)
    unless user
      halt 404, "User [#{id}] does not exist"
    end
    begin
      user.destroy
    rescue Exception => e
      halt 500, e.message
    end
    halt 200, "User [#{id}] deleted"
  end

  head '/authenticate' do
    halt 200
  end

  def self.new(*)
    app = Rack::Auth::Digest::MD5.new(super) do |username|
      user = User.filter(:username => username).first
      user.password if user
    end
    app.realm = 'HTTPCron Realm'
    app.opaque = 'secretkey'
    app
  end

end
