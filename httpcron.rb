require 'bundler'
Bundler.setup

require 'json'
require 'logger'

require 'sinatra/base'
require 'sinatra'
require 'sinatra/sequel'
require 'sequel/extensions/named_timezones'

require 'slim'

ENV['DATABASE_URL'] ||= "sqlite://#{Dir.pwd}/httpcron.sqlite3"

require_relative 'config'

Sequel.default_timezone = TZInfo::Timezone.get(HttpCronConfig::INSTANCE.server_timezone)
Sequel::Model.raise_on_save_failure = true

class HTTPCron < Sinatra::Base

  set :views, File.dirname(__FILE__) + '/views'
  set :public, File.dirname(__FILE__) + '/public'
#  set :raise_errors, true
#  set :show_exceptions, :true

  get '/' do
    slim :index
  end

  get '/tasks.json' do
    tasks = Task.all.to_json
    halt 200, {'Content-Type' => 'application/json'}, tasks
  end

end

require_relative 'lib/models'
