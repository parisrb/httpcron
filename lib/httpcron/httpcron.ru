ENV['DATABASE_URL'] ||= "sqlite://#{Dir.pwd}/httpcron.sqlite3"

require File.join(File.dirname(__FILE__), '../httpcron')

# Start the engine
HTTPCron::Engine.start

# Start the server
run Rack::URLMap.new(
        {
            "/" => HTTPCron::FrontServer,
            "/api" => HTTPCron::ApiServer
        }
    )
