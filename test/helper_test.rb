ENV['RACK_ENV'] = 'test'

require_relative '../httpcron'
require 'rspec'
require 'rack/test'

set :environment, :test

RSpec.configure do |conf|
  conf.include Rack::Test::Methods
end

module Rack
  class MockResponse
    def json_body
      JSON.parse(body)
    end
  end
end