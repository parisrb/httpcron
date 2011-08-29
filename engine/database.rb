require 'eventmachine'
require 'em-http'

require_relative 'common'

# this engine use less memory but rely more on the database

reschedule_tasks

def notify_create_task task
  p "Create task #{task}"
  if task.enabled
    possibly_set_next_execution task.next_execution
  end
end

def notify_delete_task task
  p "Delete task #{task}"
end

def notify_update_task task
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
def end_task http, content, start, task
  p "Ending task #{task.id} [#{task.name}] : #{http.response_header.status}"
  Execution.create(:task => task,
                   :status => http.response_header.status,
                   :start_at => start,
                   :duration => (SECONDS_IN_A_DAY * (DateTime.now - start)).to_i,
                   :response => response_content(http, content))
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
end

# Start all pending tasks
def start_tasks
  p "Start tasks"
  Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |t|
    start_task t
  end
  p "Tasks started"
  wakeup
end

# Update the next execution time of it is before the current one
def possibly_set_next_execution next_execution
  p "Possibly update timeout"
  if (!@@next_execution) || (next_execution < @@next_execution)
    set_next_execution next_execution
  end
end

# Set the next execution time
def set_next_execution next_execution
  wait_time = ((next_execution - DateTime.now) * SECONDS_IN_A_DAY).to_i
  @@next_execution = next_execution
  p "Setting new timeout at #{next_execution} in #{wait_time.to_s} seconds"
  @@timer.cancel if @@timer
  EventMachine.next_tick do
    @@timer = EventMachine::Timer.new(wait_time + 1) { wakeup }
  end
end

# Trigger the pending tasks
def wakeup
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

Thread.start do
  EventMachine.run do
    begin
      start_tasks
    rescue Exception => e
      p e
    end
  end
end
