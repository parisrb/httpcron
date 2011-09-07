require 'json'
require 'logger'

require 'sinatra/base'
require 'sinatra'
require 'sinatra/sequel'
require 'sequel/extensions/named_timezones'
require 'rufus-scheduler'

require 'slim'
require 'sinatra/assetpack'

module HTTPCron
end

require_relative 'httpcron/config'

Sequel.default_timezone = TZInfo::Timezone.get(HTTPCron::Config.server_timezone)
Sequel::Model.raise_on_save_failure = true

require_relative 'httpcron/front_server'
require_relative 'httpcron/api_server'

require_relative 'httpcron/models'
require_relative 'httpcron/monkey'

require_relative 'httpcron/actions/common'
require_relative 'httpcron/actions/executions'
require_relative 'httpcron/actions/tasks'
require_relative 'httpcron/actions/users'

require_relative "httpcron/engine/#{HTTPCron::Config.engine}"

