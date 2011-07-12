require 'bundler'
Bundler.setup

require 'json'
require 'logger'
#require 'tzinfo'

require 'sinatra/base'

ENV['DATABASE_URL'] ||= "sqlite://#{Dir.pwd}/httpcron.sqlite3"

require 'sinatra'
require 'sinatra/sequel'

#require 'sequel/extensions/named_timezones'
#Sequel.default_timezone = TZInfo::Timezone.get(ENV['TIMEZONE'])
Sequel::Model.raise_on_save_failure = true
require 'slim'

class HTTPCron < Sinatra::Base

  set :views, File.dirname(__FILE__) + '/views'
  set :public, File.dirname(__FILE__) + '/public'
  set :raise_errors, true
  set :show_exceptions, :true

  get '/' do
    slim :index
  end

end
