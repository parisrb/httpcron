
migration 'create table tasks/users/executions' do

  database.create_table :users do
    primary_key :id, :type => Integer, :null => false

    String :username, :size => 250, :null => true, :index => true
  end

  database.create_table :tasks do
    primary_key :id, :type => Integer, :null => false
    foreign_key :user_id, :users

    String :name, :size => 250, :null => true, :index => true
    String :url, :size => 255, :null => false
    String :cron, :size => 50, :null => false
    boolean :enabled, :null => false, :index => true, :default => true
    DateTime :created_at, :null => false
    DateTime :updated_at, :null => false
    DateTime :next_execution, :null => false
  end

  database.create_table :executions do
    primary_key :id, :type => Integer, :null => false
    foreign_key :task_id, :tasks

    Integer :status, :null => false
    Integer :duration, :null => false
    DateTime :run_at, :null => false
    String :response, :size => 5000, :null => false
  end
end

class Task < Sequel::Model
  many_to_one :user
  one_to_many :executions

  def validate
    validates_presence :name
    validates_presence :url
    validates_presence :cron
    validates_presence :enabled
    validates_presence :next_execution
  end

end

class User < Sequel::Model
  one_to_many :tasks
end

class Execution < Sequel::Model
  many_to_one :task
end
