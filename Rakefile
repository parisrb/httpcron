require 'bundler/setup'
require 'rake'
require 'rake/testtask'

APP_FILE  = 'lib/httpcron.rb'
APP_CLASS = 'HTTPCron::FrontServer'

require 'sinatra/assetpack/rake'
require 'sinatra/assetpack'
require 'sinatra'

desc "Run all tests"
Rake::TestTask.new do |t|
  t.test_files = FileList['test/*_test.rb']
  t.verbose = true
end

task :default  => :test
