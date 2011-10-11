module HTTPCron

    class ApiServer < Sinatra::Base

    set :raise_errors, true
    set :dump_errors, true

    configure :development do
      set :show_exceptions, :true
      set :logging, true
      database.loggers << Logger.new(STDOUT)
    end

    private

    def current_user
      @current_user
    end

    def current_user=(user)
      @current_user = user
    end

    get '/config' do
      content_type :json
      {:server_timezone => Config.server_timezone,
       :default_timeout => Config.default_timeout,
       :max_timeout => Config.max_timeout,
       :max_pagination_limit => Config.max_pagination_limit,
       :valid_timezones => TZInfo::Timezone.all_identifiers.join(', '),
       :mails_for_tasks => Config.mails_for_tasks
      }.to_json
    end

    head '/authenticate' do
      content_type :json
      halt 200
    end

    def self.new(*)
      app = Rack::Auth::Digest::MD5.new(super, {:passwords_hashed => true}) do |username|
        user = User.filter(:username => username).first
        user.password if user
      end
      app.realm = ::HTTPCron::REALM
      app.opaque = '1hj540cdui23j43l3578nkm8634ruso5443lmg'
      app
    end

  end
end
