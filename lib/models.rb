Sequel::Model.plugin :validation_helpers
Sequel::Plugins::ValidationHelpers::DEFAULT_OPTIONS.merge!(
    :presence=>{:message=>'cannot be empty'}
)

Sequel::Model.plugin :timestamps, :update_on_create => true
Sequel::Model.plugin :json_serializer, :naked => true
Sequel::Model.plugin :association_dependencies
Sequel.extension :pagination

max_timezone_length = TZInfo::Timezone.all_identifiers.max { |t1, t2| t1.length <=> t2.length }.length

migration 'create tables tasks/users/executions' do

  database.create_table :users do
    primary_key :id

    String :username, :size => 250, :null => false, :index => true, :unique => true
    Boolean :admin, :null => false, :default => false
    String :timezone, :size => max_timezone_length, :null => false
    String :password, :null => false

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
    String :timezone, :size => max_timezone_length, :null => false
    DateTime :next_execution, :null => false

    DateTime :created_at, :null => false
    DateTime :updated_at, :null => false
  end

  database.create_table :executions do
    primary_key :id
    foreign_key :task_id, :tasks

    Integer :status, :null => false
    DateTime :start_at, :null => false
    Integer :duration, :null => false
    String :response, :size => 5000, :null => true
  end
end

module ModelWithTimezone

  def validate_timezone
    begin
      TZInfo::Timezone.get(self.timezone)
      true
    rescue TZInfo::InvalidTimezoneIdentifier
      errors.add('timezone', "[#{self.timezone}] is not a valid timezone")
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
    super
    self.timezone ||= HttpCronConfig.server_timezone
  end

  def validate
    super
    validates_presence [:username, :timezone]
    validates_unique :username
    validate_timezone
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
          errors.add('timeout', "timeout [#{self.timeout.to_s}] should be > 0")
        end
      end
    end

    begin
      URI.parse self.url
    rescue URI::InvalidURIError
      errors.add('url', "[#{self.url}] is not a valid url")
    end
    if validate_timezone
      # don't validate the cron expression if the timezone is wrong
      begin
        recalculate_cron
      rescue ArgumentError
        errors.add('cron', "[#{self.cron}] is not a valid cron expression")
      end
    end
  end

  def before_create
    super
    unless self.next_execution
      recalculate_cron
    end
  end

  def before_update
    super
    if self.enabled
      recalculate_cron
    end
  end

  def after_create
    super
    notify_create_task self
  end

  def after_destroy
    super
    notify_delete_task self
  end

  def recalculate_cron from = Time.now
    self.next_execution = Rufus::CronLine.new("#{self.cron} #{self.timezone}").next_time(from)
  end

  def to_json(*a)
    self.enabled ? super(:except => :user_id) : super(:except => [:user_id, :next_execution])
  end

  def to_s
    "#{id}, name: [#{name}], user: #{user_id}, cron: [#{cron}], timezone: [#{timezone}], url [#{url}]"
  end

end

class Execution < Sequel::Model

  many_to_one :task
  many_to_one :user, :through => :task

  def validate
    super
    validates_presence [:status, :duration, :start_at]
    if self.response
      validates_max_length 5000, :response
    end
  end

end

if User.count == 0
  User.create(:username => 'httpcronadmin', :admin => true, :password => 'httpcronadmin')
end
