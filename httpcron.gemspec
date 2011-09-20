# -*- encoding: utf-8 -*-
$:.push File.expand_path('../lib', __FILE__)

require 'httpcron/version'

Gem::Specification.new do |s|
  s.name        = 'httpcron'
  s.version     = HTTPCron::VERSION
  s.authors     = ['Paris.rb team']
  s.homepage    = 'https://github.com/parisrb/httpcron'
  s.summary     = 'Ruby HTTP Cron table'
  s.description = 'Ruby HTTP Cron table'

  s.rubyforge_project = 'httpcron'

  s.add_runtime_dependency 'sinatra', '~> 1.2'
  s.add_runtime_dependency 'sequel', '~> 3.27'
  s.add_runtime_dependency 'sinatra-sequel', '~> 0.9'
  s.add_runtime_dependency 'rufus-scheduler', '~> 2.0'
  s.add_runtime_dependency 'tzinfo', '~> 0.3'
  s.add_runtime_dependency 'slim', '~> 1.0'
  s.add_runtime_dependency 'eventmachine', '1.0.0.beta.4'
  s.add_runtime_dependency 'em-http-request', '1.0.0'
  s.add_runtime_dependency 'sinatra-assetpack', '~> 0.0.10'

  s.add_development_dependency 'sqlite3'
  s.add_development_dependency 'rake'
  s.add_development_dependency 'uglifier'
  s.add_development_dependency 'sass'
  s.add_development_dependency 'rack-test'
  # s.add_development_dependency 'capybara-webkit', '~> 1.0.0.beta'

  s.files         = `git ls-files`.split("\n") + `git ls-files -o lib/httpcron/public`.split("\n")
  s.test_files    = `git ls-files -- test/*`.split("\n")
  s.require_paths = ['lib']
end
