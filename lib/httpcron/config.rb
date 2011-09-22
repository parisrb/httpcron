# Access the configuration
class HTTPCron::Config

  # The server timezone
  def self.server_timezone
    @@server_timezone ||= get_value('TIMEZONE', 'Europe/Paris')
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

  def self.admin_email_address
    @@admin_email_address ||= get_value('ADMIN_EMAIL_ADDRESS', 'admin@yourdomain.org')
  end

  def self.smtp_hostname
    @@smtp_hostname ||= get_value('SMTP_HOST', 'your.smtp.host')
  end

  def self.smtp_port
    @@smtp_port ||= get_value_i('SMTP_PORT', 587)
  end

  def self.smtp_domain
    @@smtp_domain ||= get_value('SMTP_DOMAIN', 'your_domain.org')
  end

  def self.smtp_user
    @@smtp_user ||= get_value('SMTP_USER', nil)
  end

  def self.smtp_password
    @@smtp_password ||= get_value('SMTP_PASSWORD', nil)
  end

  def self.sender_email_address
    @@smtp_password ||= get_value('SENDER_EMAIL_ADDRESS', "noreply@#{self.smtp_domain}")
  end

  def self.password_pattern
    @@password_pattern ||= get_value('PASSWORD_PATTERN', 'cdszC{6}')
  end

  private

  def self.get_value env_name, default_value
    ENV[env_name] || default_value
  end

  def self.get_value_i env_name, default_value
    ENV[env_name] ? ENV[env_name].to_i : default_value
  end

end
