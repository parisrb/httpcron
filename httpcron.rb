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
    slim :index
  end

  get '/users.json' do
    content_type :json
    User.all.to_json
  end

  get '/tasks.json' do
    content_type :json
    Task.all.to_json
  end

  post '/tasks.json' do
    check_parameter_for_blank :name, :url, :cron, :user_id

    user = User.where(:id => params[:user_id]).first
    unless user
      halt 500, "User with id [#{params[:user_id]}] not found"
    end

    t = Task.new(:user => user,
                    :name => params[:name],
                    :url => params[:url],
                    :cron => params[:cron],
                    :timezone => (params[:timezone] || user.timezone))
    unless t.valid?
      halt 500, t.errors.values.join("\n")
    end
    t.save

    content_type :json
    t.to_json
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
end

require_relative 'lib/models'
require_relative 'lib/helper'

