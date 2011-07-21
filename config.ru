ENV['DATABASE_URL'] ||= "sqlite://#{Dir.pwd}/httpcron.sqlite3"

require './httpcron'

run Rack::URLMap.new({
  "/" => HTTPCron,
  "/api" => HTTPCronApi
})
