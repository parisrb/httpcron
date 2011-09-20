# Access the configuration
class HTTPCron::Config

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
    @@max_timeout ||= get_value_i('MAX_TIMEOUT', 300)
  end

  # The engine to use, possible values are database or memory
  def self.engine
    @@engine ||= get_value('ENGINE', 'database')
  end

  # Max pagination limit
  def self.max_pagination_limit
    @@max_pagination_limit ||= get_value_i('MAX_PAGINATION_LIMIT', 100)
  end

  private

  def self.get_value env_name, default_value
    ENV[env_name] || default_value
  end

  def self.get_value_i env_name, default_value
    ENV[env_name] ? ENV[env_name].to_i : default_value
  end

end