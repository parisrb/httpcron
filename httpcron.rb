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

  helpers do
    def javascript_incudes
      html = ''
      if development?
        require 'yaml'
        assets = YAML::load(File.read(File.dirname(__FILE__) + '/assets.yml'))
        assets['javascripts']['application'].each do |file|
          html += '<script src="'+file.gsub(/^public/, '')+'" type="text/javascript"></script>'
        end
      else
        html = '<script src="assets/application.js" type="text/javascript"></script>'
      end
      html
    end
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

  def current_user
    @current_user
  end

  def current_user=(user)
    @current_user = user
  end

  # Check if the current user is an admin
  # raise a 403 elsewhere
  def check_admin
    unless current_user.admin
      halt 403
    end
  end

  # Get the offset and limit params value
  # and set them as @offset and @limit
  # default are 0 and 100
  def pagination_params
    if params[:limit]
      @limit = params[:limit].to_i
      if @limit <= 0
        halt 500, "Limit is [#{@limit}] but shouldn't be <= 0"
      elsif @limit > HttpCronConfig.max_pagination_limit
        halt 500, "Limit is [#{@limit}] but should be <= #{HttpCronConfig.max_pagination_limit}"
      end
    else
      @limit = 100
    end

    if params[:offset]
      @offset = params[:offset].to_i
      if @offset < 0
        halt 500, "Offset is [#{@offset}] but shouldn't be < 0"
      end
      @offset += 1
    else
      @offset = 1
    end
  end

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

# mokey patch Rack to work with xhr digest

module Rack
  module Auth
    module Digest
      class MD5 < AbstractHandler

        alias :org_call :call

        def call(env)
          @requested_with = env['HTTP_X_REQUESTED_WITH']
          org_call(env)
        end

        def xhr?
          @requested_with == 'XMLHttpRequest'
        end

        private

        def unauthorized(www_authenticate = challenge)
          headers = {'Content-Type' => 'text/plain', 'Content-Length' => '0'}
          if xhr?
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

require_relative 'lib/models'
require_relative 'lib/helper'

require_relative 'actions/executions'
require_relative 'actions/tasks'
require_relative 'actions/users'

require_relative "engine/#{HttpCronConfig.engine}"

