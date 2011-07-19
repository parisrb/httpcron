require 'bundler'
Bundler.setup

require 'json'
require 'logger'

require 'sinatra/base'
require 'sinatra'
require 'sinatra/sequel'
require 'sequel/extensions/named_timezones'
require 'rufus-scheduler'

require 'slim'
require 'erb'

require_relative 'config'

Sequel.default_timezone = TZInfo::Timezone.get(HttpCronConfig.server_timezone)
Sequel::Model.raise_on_save_failure = true

class HTTPCron < Sinatra::Base

  set :views, File.dirname(__FILE__) + '/views'
  set :public, File.dirname(__FILE__) + '/public'
  set :raise_errors, true
  set :dump_errors, true

  configure :development do
    set :show_exceptions, :true
    set :logging, true
    database.loggers << Logger.new(STDOUT)
  end

  get '/' do
    erb :index, :layout_engine => :slim
  end

end

class HTTPCronApi < Sinatra::Base

  set :raise_errors, true
  set :dump_errors, true

  configure :development do
    set :show_exceptions, :true
    set :logging, true
    database.loggers << Logger.new(STDOUT)
  end

  private

  def check_parameter_for_blank *params_names
    params_names.each do |param_name|
      if params[param_name]
        if params[param_name].blank?
          halt 500, "Parameter [#{param_name}] is blank"
        end
      else
        halt 500, "No [#{param_name}] parameter"
      end
    end
  end

  def current_user
    User.first
  end
end

require_relative 'lib/models'
require_relative 'lib/helper'

require_relative 'actions/tasks'
require_relative 'actions/users'

require_relative 'engine/engine2'

