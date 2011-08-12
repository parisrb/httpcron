require 'eventmachine'
require 'em-http'
# this engine use less memory but rely more on the database

# recron past tasks
SECONDS_IN_A_DAY = 86400

def notify_create_task task
  p "Create task #{task}"
  if task.enabled
    @@tasks[task.id] = set_next_execution task
  end
end

def notify_delete_task task
  p "Delete task #{task}"
  if @@tasks.key? task.id
    @@tasks[task.id].cancel
    @@tasks.delete task.id
  end
end

def notify_update_task task
  p "Update task #{task}"
  if task.enabled
    @@tasks[task.id].cancel if @@tasks.key? task.id
    @@tasks[task.id] = set_next_execution task
  else
    notify_delete_task task
  end
end

private

# reschedule tasks whose execution date is in the past
count = 0
from = Time.now
Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |t|
  t.recalculate_cron(from)
  t.save
  count += 1
end
p "#{count} task(s) rescheduled"

@@tasks = {}

# Called when a task as ended
# http:: the http request
# start:: starting date
# task:: the corresponding task
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

  @@tasks[task.id] = set_next_execution task
end

# Start a task
def start_task task
    p "Start task #{task.id} [#{task.name}]"
    start = DateTime.now
    http = EventMachine::HttpRequest.new(task.url).get :redirects => 5, :timeout => task.timeout
    http.callback do
      end_task(http, start, task)
    end
    http.errback do
      end_task(http, start, task)
    end
end

# Start all pending tasks
def start_tasks
  p "Start tasks"

  Task.filter('enabled = ?', true).order(:next_execution.asc).each do |t|
    @@tasks[t.id] = set_next_execution t
  end
end

# Set the next execution time
# TODO Reutiliser le timer existant
def set_next_execution task
  wait_time = (task.next_execution - DateTime.now) * SECONDS_IN_A_DAY
  p "Setting new timeout: will wait #{wait_time.round} seconds"
  EventMachine::Timer.new(wait_time) { start_task task }
end

Thread.start do
  EventMachine.run do
    begin
      start_tasks
    rescue Exception => e
      p e
    end
  end
end
