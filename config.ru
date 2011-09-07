ENV['DATABASE_URL'] ||= "sqlite://#{Dir.pwd}/httpcron.sqlite3"

require './lib/httpcron'

# Start the engine
HTTPCron::Engine.start_engine

run Rack::URLMap.new(
        {
            "/" => HTTPCron::FrontServer,
            "/api" => HTTPCron::ApiServer
        }
    )
