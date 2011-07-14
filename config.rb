class HttpCronConfig

  attr_accessor :server_timezone

  def initialize
    @server_timezone = ENV['TIMEZONE'] || 'UTC'
  end

  INSTANCE = HttpCronConfig.new

end