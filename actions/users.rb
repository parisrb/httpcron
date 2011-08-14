module Rack
  module Auth
    module Digest
      class MD5 < AbstractHandler

        alias :org_call :call

        def call(env)
          @x_digest_authentication = env['HTTP_X_DIGEST_AUTHENTICATION']
          org_call(env)
        end

        def x_digest_authentication?
          @x_digest_authentication
        end

        private

        def unauthorized(www_authenticate = challenge)
          headers = {'Content-Type' => 'text/plain', 'Content-Length' => '0'}
          if x_digest_authentication?
            headers['X-WWW-Authenticate'] = www_authenticate.to_s
          else
            headers['WWW-Authenticate'] = www_authenticate.to_s
          end
          return [401, headers, []]
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
    pagination_params

    content_type :json
    users = User.paginate(@offset, @limit)
    {:total => users.pagination_record_count, :records => users}.to_json
  end

  get '/users/current' do
    content_type :json
    current_user.to_json
  end

  get '/users/:id' do |id|
    check_admin
    if current_user.id != id
      user = User[id]
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
    user = User[id]
    unless user
      halt 404, "User [#{id}] does not exist"
    end
    begin
      user.destroy
    rescue Exception => e
      halt 500, e.message
    end
    content_type :json
    halt 200
  end

  head '/authenticate' do
    content_type :json
    halt 200
  end

  def self.new(*)
    app = Rack::Auth::Digest::MD5.new(super) do |username|
      user = User.filter(:username => username).first
      user.password if user
    end
    app.realm = 'CromagnonApi'
    app.opaque = '1hj540cdui23j43l3578nkm8634ruso5443lmg'
    app
  end

end
