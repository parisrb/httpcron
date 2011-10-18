require 'rack/auth/digest/md5'

Sequel::Model.plugin :validation_helpers
Sequel::Plugins::ValidationHelpers::DEFAULT_OPTIONS.merge!(
    :presence=>{:message=>'cannot be empty'}
)

Sequel::Model.plugin :timestamps, :update_on_create => true
Sequel::Model.plugin :json_serializer, :naked => true
Sequel::Model.plugin :association_dependencies
Sequel.extension :pagination

EmailVeracity::Config[:skip_lookup] = true

MAX_TIMEZONE_LENGTH = TZInfo::Timezone.all_identifiers.max { |t1, t2| t1.length <=> t2.length }.length

migration 'create tables tasks/users/executions' do

  database.create_table :users do
    primary_key :id

    String :username, :size => 250, :null => false, :index => true, :unique => true
    Boolean :admin, :null => false, :default => false
    String :timezone, :size => MAX_TIMEZONE_LENGTH, :null => false
    String :password, :null => false
    String :email_address, :null => false, :index => true, :unique => true

    DateTime :created_at, :null => false
    DateTime :updated_at, :null => false
  end

  database.create_table :tasks do
    primary_key :id

    foreign_key :user_id, :users

    String :name, :size => 250, :null => false, :index => true
    String :url, :size => 255, :null => false
    Integer :timeout, :null => false
    boolean :enabled, :null => false, :index => true, :default => true

    String :cron, :size => 50, :null => false
    String :timezone, :size => MAX_TIMEZONE_LENGTH, :null => false
    DateTime :next_execution, :null => true

    boolean :mail_when_success, :null => false
    boolean :mail_when_failure, :null => false

    DateTime :created_at, :null => false
    DateTime :updated_at, :null => false
  end

  database.create_table :executions do
    primary_key :id
    foreign_key :task_id, :tasks

    Integer :status, :null => false
    DateTime :started_at, :null => false
    Integer :duration, :null => false
    String :response, :size => 5000, :null => true
  end
end

module HTTPCron

  REALM = 'httpcron'

  module ModelWithTimezone

    def validate_timezone
      begin
        TZInfo::Timezone.get(self.timezone)
        true
      rescue TZInfo::InvalidTimezoneIdentifier
        errors.add('timezone', "[#{self.timezone}] is invalid")
        false
      end
    end

  end

  class User < Sequel::Model

    include ModelWithTimezone

    one_to_many :tasks
    one_to_many :executions, :through => :tasks

    add_association_dependencies :tasks => :delete

    def before_validation
      if new?
        self.timezone ||= Config.server_timezone
      end
    end

    def before_create
      super
      self.hash_password!
    end

    def validate
      super
      validates_presence [:username, :timezone, :password, :email_address]
      validates_unique :username, :email_address
      validate_timezone
      validates_max_length 250, :username
      validates_max_length MAX_TIMEZONE_LENGTH, :timezone
      unless EmailVeracity::Address.new(self.email_address).valid?
        errors.add('email_address', "[#{self.email_address}] is invalid")
      end
    end

    def hash_password!
      if self.password && self.username
        self.password = ::Digest::MD5.hexdigest([self.username, HTTPCron::REALM, self.password] * ':')
      end
    end

    def to_json(*a)
      super(:except => :password)
    end

  end

  class Task < Sequel::Model

    include ModelWithTimezone

    many_to_one :user
    one_to_many :executions

    add_association_dependencies :executions => :delete

    def validate
      super
      validates_presence [:name, :url, :timeout, :cron, :user_id, :timezone]

      unless errors.on('timeout')
        validates_integer :timeout
        unless errors.on('timeout')
          if Kernel.Integer(self.timeout.to_s) <= 0
            errors.add('timeout', "[#{self.timeout.to_s}] should be > 0")
          end
        end
      end

      begin
        URI.parse self.url
      rescue URI::InvalidURIError
        errors.add('url', "[#{self.url}] is invalid")
      end

      if validate_timezone
        # don't validate the cron expression if the timezone is wrong

        if changed_columns.include?(:cron) || changed_columns.include?(:timezone)
          @cronline = nil

          begin
            self.next_execution = self.enabled ? calculate_next_execution : nil
          rescue ArgumentError
            errors.add('cron', "[#{self.cron}] is invalid")
          end
        end
      end

      validates_max_length 250, :name
      validates_max_length 255, :url
      validates_max_length 50, :cron
      validates_max_length MAX_TIMEZONE_LENGTH, :timezone
    end

    def after_create
      super
      Engine.notify_create_task self
    end

    def after_destroy
      super
      Engine.notify_delete_task self
    end

    def cronline
      @cronline ||= Rufus::CronLine.new("#{self.cron} #{self.timezone}")
    end

    def calculate_next_execution from = Time.now
      cronline.next_time(from)
    end

    def to_s
      "#{id}, name: [#{name}], user: #{user_id}, enabled: #{enabled}, cron: [#{cron}], timezone: [#{timezone}], url [#{url}], next execution [#{next_execution}]"
    end

  end

  class Execution < Sequel::Model

    many_to_one :task
    many_to_one :user, :through => :task

    def validate
      super
      validates_presence [:status, :duration, :started_at]
      if self.response
        validates_max_length 5000, :response
      end
    end

  end

  if User.count == 0
    User.create(:username => 'httpcronadmin', :admin => true, :password => 'httpcronadmin', :email_address => Config.admin_email_address)
  end

end