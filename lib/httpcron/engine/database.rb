require 'eventmachine'
require 'em-http'

require_relative 'common'

# this engine use less memory but rely more on the database
module HTTPCron

  module Engine

    def self.notify_create_task task
      p "Create task #{task}"
      if task.enabled
        possibly_set_next_execution task.next_execution
      end
    end

    def self.notify_delete_task task
      p "Delete task #{task}"
    end

    def self.notify_update_task task
      p "Update task #{task}"
      if task.enabled
        possibly_set_next_execution task.next_execution
      end
    end

    private

    @@running_tasks = {}
    @@next_execution = nil
    @@timer = nil

    # Called when a task as ended
    # http:: the http request
    # content:: the response' content
    # start:: starting date
    # task:: the corresponding task
    def self.end_task http, content, start, task
      task_ended http, content, start, task

      from = Time.now
      # start of next minute
      from += 60 - from.sec

      task.next_execution = task.calculate_next_execution(from)
      task.save

      @@running_tasks.delete task.id
      possibly_set_next_execution task.next_execution
    end

    # Start a task
    def self.start_task task
      unless @@running_tasks[task.id]
        @@running_tasks[task.id] = task
        run_task(task) do |http, content, start|
          end_task(http, content, start, task)
        end
      end
    end

    # Start all pending tasks
    def self.start_tasks
      p "Start tasks"
      Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |t|
        start_task t
      end
      p "Tasks started"
      wakeup
    end

    # Update the next execution time of it is before the current one
    def self.possibly_set_next_execution next_execution
      p "Possibly update timeout"
      if (!@@next_execution) || (next_execution < @@next_execution)
        set_next_execution next_execution
      end
    end

    # Set the next execution time
    def self.set_next_execution next_execution
      wait_time = ((next_execution - DateTime.now) * SECONDS_IN_A_DAY).to_i
      @@next_execution = next_execution
      p "Setting new timeout at #{next_execution} in #{wait_time.to_s} seconds"
      @@timer.cancel if @@timer
      EventMachine.next_tick do
        @@timer = EventMachine::Timer.new(wait_time + 1) { wakeup }
      end
    end

    # Trigger the pending tasks
    def self.wakeup
      @@next_execution = nil
      @@timer.cancel if @@timer

      p "Looking for tasks to run"
      if @@running_tasks.empty?
        task = Task.filter('enabled = ?', true).order(:next_execution.asc).first
      else
        task = Task.filter('enabled = ? and id not in ?', true, @@running_tasks.keys).order(:next_execution.asc).first
      end
      if task
        if task.next_execution < DateTime.now
          # execution date is passed: run tasks
          start_tasks
        else
          # in the future => recron
          possibly_set_next_execution task.next_execution
        end
      else
        p "No task, just waiting"
        EventMachine.next_tick do
          @@timer = EventMachine::Timer.new(300) { wakeup } unless @@timer
        end
      end
    end

  end

end