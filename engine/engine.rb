require 'eventmachine'
require 'em-http'

# recron past tasks
SECONDS_IN_A_DAY = 24 * 60 * 60

count = 0
from = Time.now
Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |t|
  t.recalculate_cron(from)
  t.save
  count += 1
end
p "#{count} task(s) rescheduled"

RUNNING_TASKS = {}

def end_task http, start, task
  p "Ending task #{task.id} [#{task.name}] : #{http.response_header.status}"
  Execution.create(:task => task,
                   :status => http.response_header.status,
                   :run_at => start,
                   :duration => (SECONDS_IN_A_DAY * (DateTime.now - start)).to_i,
                   :response => http.response[0...4000])
  from = Time.now
  from += 60 - from.sec
  task.recalculate_cron(from)
  task.save
  RUNNING_TASKS.delete task.id
end

def run_task task
  unless RUNNING_TASKS[task.id]
    p "Starting task #{task.id} [#{task.name}]"
    RUNNING_TASKS[task.id] = task
    start = DateTime.now
    http = EventMachine::HttpRequest.new(task.url).get :redirects => 5, :timeout => task.timeout
    http.callback do
      end_task(http, start, task)
    end
    http.errback do
      end_task(http, start, task)
    end
  end
end

def run_tasks
  p "Checking for tasks"
  Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |t|
    run_task t
  end
end

if ENV['START_ENGINE']
  Thread.start do
    EventMachine.run do
      EventMachine::add_periodic_timer(60) do
        run_tasks
      end
    end
  end
end
