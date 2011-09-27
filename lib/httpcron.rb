require 'bundler/setup'

require 'json'
require 'logger'

require 'sinatra/base'
require 'sinatra'
require 'sinatra/sequel'
require 'sequel/extensions/named_timezones'
require 'rufus-scheduler'

require 'slim'
require 'sinatra/assetpack'

require 'keepass/password'
require 'mail'
require 'erb'

require 'email_veracity'

module HTTPCron
end

require_relative 'httpcron/config'

Sequel.default_timezone = TZInfo::Timezone.get(HTTPCron::Config.server_timezone)
Sequel::Model.raise_on_save_failure = true

Mail.defaults do
  delivery_method :smtp, {
    :address => HTTPCron::Config.smtp_hostname,
    :port => HTTPCron::Config.smtp_port,
    :domain => HTTPCron::Config.smtp_domain,
    :user_name => HTTPCron::Config.smtp_user,
    :password => HTTPCron::Config.smtp_password,
    :authentication => 'plain',
    :enable_starttls_auto => true
  }
end

require_relative 'httpcron/front_server'
require_relative 'httpcron/api_server'

require_relative 'httpcron/models'
require_relative 'httpcron/monkey'

require_relative 'httpcron/actions/common'
require_relative 'httpcron/actions/executions'
require_relative 'httpcron/actions/tasks'
require_relative 'httpcron/actions/users'

require_relative "httpcron/engine/#{HTTPCron::Config.engine}"

