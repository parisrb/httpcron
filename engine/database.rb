require 'eventmachine'
require 'em-http'
# this engine use less memory but rely more on the database

# recron past tasks
SECONDS_IN_A_DAY = 24 * 60 * 60

def create_task task
  p "Create task #{task}"
  if task.enabled
    possibly_set_next_execution task.next_execution
  end
end

def update_task task
  p "Update task #{task}"
  if task.enabled
    possibly_set_next_execution task.next_execution
  end
end

def delete_task task
  p "Delete task #{task}"
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

@@running_tasks = {}
@@next_execution = nil
@@timer = nil

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
  @@running_tasks.delete task.id
  possibly_set_next_execution task.next_execution
end

# Start a task
def start_task task
  unless @@running_tasks[task.id]
    p "Start task #{task.id} [#{task.name}]"
    @@running_tasks[task.id] = task
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

# Start all pending tasks
def start_tasks
  p "Start tasks"
  Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |t|
    start_task t
  end
  wakeup
end

# Update the next execution time of it is before the current one
def possibly_set_next_execution next_execution
  p "Possibly update timeout"
  unless @@next_execution && (next_execution > @@next_execution)
    set_next_execution next_execution
  end
end

# Set the next execution time
def set_next_execution next_execution
  @@timer.cancel if @@timer
  wait_time = (next_execution - DateTime.now) * SECONDS_IN_A_DAY
  p "Setting new timeout: will wait #{wait_time.round} seconds"
  @@timer = EventMachine::Timer.new(wait_time) { wakeup }
  @@next_execution = next_execution
end

# Trigger the pending tasks
def wakeup
  @@next_execution = nil
  @@timer.cancel if @@timer

  p "Calculate next execution"
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
      possibly_set_next_execution task.next_execution
    end
  else
    p "No task, just waiting"
    @@timer = EventMachine::Timer.new(300) { wakeup } unless @@timer
  end
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
