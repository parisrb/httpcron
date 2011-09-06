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

module HTTPCron

end

require_relative 'lib/httpcron/config'

Sequel.default_timezone = TZInfo::Timezone.get(HTTPCron::Config.server_timezone)
Sequel::Model.raise_on_save_failure = true

require_relative 'lib/httpcron/front_server'
require_relative 'lib/httpcron/api_server'

require_relative 'lib/httpcron/models'
require_relative 'lib/httpcron/monkey'

require_relative 'lib/httpcron/actions/common'
require_relative 'lib/httpcron/actions/executions'
require_relative 'lib/httpcron/actions/tasks'
require_relative 'lib/httpcron/actions/users'

require_relative "lib/httpcron/engine/#{HTTPCron::Config.engine}"

