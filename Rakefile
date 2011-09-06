require 'bundler/setup'
require 'rake'
require 'rake/testtask'

APP_FILE  = 'httpcron.rb'
APP_CLASS = 'HTTPCron'

require 'sinatra/assetpack/rake'

desc "Run all tests"
Rake::TestTask.new do |t|
  t.test_files = FileList['test/*_test.rb']
  t.verbose = true
end

task :default  => :test
