ENV['DATABASE_URL'] ||= "sqlite://#{Dir.pwd}/httpcron.sqlite3"
ENV['START_ENGINE'] = 'true'

require './httpcron'

run Rack::URLMap.new({
  "/" => HTTPCron,
  "/api" => HTTPCronApi
})
