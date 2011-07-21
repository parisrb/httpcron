class HttpCronConfig

  # The server timezone
  def self.server_timezone
    @@server_timezone ||= get_value('TIMEZONE', 'UTC')
  end

  # Default timeout
  def self.default_timeout
    @@default_timeout ||= get_value_i('DEFAULT_TIMEOUT', 60)
  end

  # Max timeout
  def self.max_timeout
    @@max_timeout ||= get_value_i('DEFAULT_TIMEOUT', 300)
  end

  def self.engine
    @@engine ||= get_value('ENGINE', 'engine')
  end

  private

  def self.get_value env_name, default_value
    ENV[env_name] || default_value
  end

  def self.get_value_i env_name, default_value
    ENV[env_name] ? ENV[env_name].to_i : default_value
  end

end