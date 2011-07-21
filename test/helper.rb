ENV['RACK_ENV'] = 'test'
ENV['ENGINE'] = 'none'

require_relative '../httpcron'
require 'test/unit'
require 'rack/test'
require 'minitest/spec'
include Rack::Test::Methods

module Rack
  class MockResponse
    def json_body
      JSON.parse(body)
    end
  end
end
