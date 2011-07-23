module Rack
  module Auth
    class AbstractHandler
      private

      def unauthorized(www_authenticate = challenge)
        code = 442 #@env['HTTP_X_DIGEST_UNAUTHORIZED']
        return [ code || 401,
          { 'Content-Type' => 'text/plain',
            'Content-Length' => '0',
            'WWW-Authenticate' => www_authenticate.to_s },
          []
        ]
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
    content_type :json
    User.all.to_json
  end

  post '/users' do
    # TODO: Create user
    halt 200
  end

  head '/authenticate' do
    halt 200
  end

  def self.new(*)
    return super if test?
    app = Rack::Auth::Digest::MD5.new(super) do |username|
      user = User.filter(:username => username).first
      user.password if user
    end
    app.realm = 'HTTPCron Realm'
    app.opaque = 'secretkey'
    app
  end

end
