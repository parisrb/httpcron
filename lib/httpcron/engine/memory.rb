require 'eventmachine'
require 'em-http'

require_relative 'common'

# this engine use more memory and rely less on the database

module HTTPCron

  module Engine

    def self.notify_create_task task
      p "Create task #{task}"
      if task.enabled
        @@tasks[task.id] = setup_next_execution task
      end
    end

    def self.notify_delete_task task
      p "Delete task #{task}"
      if @@tasks.key? task.id
        @@tasks.delete(task.id).cancel
      end
    end

    def self.notify_update_task task
      p "Update task #{task}"
      if task.enabled
        @@tasks[task.id].cancel if @@tasks.key? task.id
        @@tasks[task.id] = setup_next_execution(task)
      else
        notify_delete_task task
      end
    end

    private

    @@tasks = {}

    # Called when a task as ended
    # http:: the http request
    # content:: the response' content
    # start:: starting date
    # task:: the corresponding task
    def self.end_task http, content, start, task
      p "Ending task #{task.id} [#{task.name}] : #{http.response_header.status}"
      Execution.create(:task => task,
                       :status => http.response_header.status,
                       :started_at => start,
                       :duration => (SECONDS_IN_A_DAY * (DateTime.now - start)).to_i,
                       :response => response_content(http, content))

      from = Time.now
      from += 60 - from.sec
      task.next_execution = task.calculate_next_execution(from)
      task.save

      @@tasks[task.id] = setup_next_execution task
    end

    # Start a task
    def self.start_task task
      p "Start task #{task.id} [#{task.name}]"
      content = ""
      start = DateTime.now
      http = EventMachine::HttpRequest.new(task.url).get :redirects => 5, :timeout => task.timeout
      http.stream do |chunk|
        if content.length < 4000
          content << chunk
        end
      end
      http.callback do
        end_task(http, content, start, task)
      end
      http.errback do
        end_task(http, content, start, task)
      end
    end

    # Start all pending tasks
    def self.setup_tasks
      p "Start tasks"
      Task.filter('enabled = ?', true).order(:next_execution.asc).each do |t|
        @@tasks[t.id] = setup_next_execution(t)
      end
    end

    # Setup the next execution
    # return the corresponding time
    def self.setup_next_execution task
      wait_time = (task.next_execution - DateTime.now) * SECONDS_IN_A_DAY
      p "Setting new timeout: will wait #{wait_time.round} seconds"
      EventMachine.next_tick do
        EventMachine::Timer.new(wait_time) { start_task task }
      end
    end

    # Start the engine
    def self.start_engine
      reschedule_tasks

      Thread.start do
        EventMachine.run do
          begin
            setup_tasks
          rescue Exception => e
            p e
          end
        end
      end
    end
  end
end