require 'rake'
require 'rake/testtask'
require 'sass'
require 'compass'

## HELPERS ##

def create_scss_engine path, filename
  Sass::Engine.new(File.read(File.join(path, "#{filename}.scss")),
    :syntax => :scss,
    :load_paths => Compass.configuration.sass_load_paths
  )
end

desc "Run all tests"
Rake::TestTask.new do |t|
  t.test_files = FileList['test/*_test.rb']
  t.verbose = true
end

namespace :assets do
  desc "Build assets with jammit"
  task :build do
    `jammit -c assets.yml`
    css_path = './public/src/stylesheets'
    engine = create_scss_engine css_path, 'application'
    File.open('./public/assets/application.css', 'w') do |f|
      f << File.read(File.join(css_path, "boilerplate.css")) + "\n"
      f << engine.render
    end
  end
end

task :default  => :test
