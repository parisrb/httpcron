Sequel::Model.plugin :validation_helpers

migration 'create tables tasks/users/executions' do

  database.create_table :users do
    primary_key :id

    String :username, :size => 250, :null => false, :index => true, :unique => true
    String :timezone, :size => 25, :null => false
    DateTime :created_at, :null => false
    DateTime :updated_at, :null => false
  end

  database.create_table :tasks do
    primary_key :id
    foreign_key :user_id, :users

    String :name, :size => 250, :null => true, :index => true
    String :url, :size => 255, :null => false
    boolean :enabled, :null => false, :index => true, :default => true

    String :cron, :size => 50, :null => false
    DateTime :next_execution, :null => false

    DateTime :created_at, :null => false
    DateTime :updated_at, :null => false
  end

  database.create_table :executions do
    primary_key :id
    foreign_key :task_id, :tasks

    Integer :status, :null => false
    DateTime :run_at, :null => false
    Integer :duration, :null => false
    String :response, :size => 5000, :null => true
  end
end

class User < Sequel::Model
  one_to_many :tasks

  def validate
    validates_presence :username, :timezone
    validates_unique :username
  end
end

class Task < Sequel::Model
  many_to_one :user
  one_to_many :executions

  def validate
    validates_presence :name, :url, :enabled, :cron, :next_execution
  end

end

class Execution < Sequel::Model
  many_to_one :task

  def validate
    validates_presence :status, :duration, :run_at
  end
end
