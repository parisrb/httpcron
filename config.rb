class HttpCronConfig

  def self.server_timezone
    @@server_timezone ||= ENV['TIMEZONE'] || 'UTC'
  end

end