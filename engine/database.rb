require 'eventmachine'
require 'em-http'
# this engine use less memory but rely more on the database

# recron past tasks
SECONDS_IN_A_DAY = 24 * 60 * 60

def create_task task
  p "Create task #{task}"
  if task.enabled
    possibly_add_next_execution task.next_execution
  end
end

def update_task task
  p "Update task #{task}"
  if task.enabled
    possibly_add_next_execution task.next_execution
  end
end

def delete_task task
  p "Delete task #{task}"
end

private

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
  possibly_add_next_execution task.next_execution
end

def run_task task
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

def run_tasks
  p "Start tasks"
  Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |t|
    run_task t
  end
  calculate_next_execution
end

def possibly_add_next_execution next_execution
  p "Possibly update timeout"
  unless @@next_execution && (next_execution > @@next_execution)
    add_next_execution next_execution
  end
end

def add_next_execution next_execution
  @@timer.cancel if @@timer
  wait_time = (next_execution - DateTime.now) * SECONDS_IN_A_DAY
  p "Setting new timeout: will wait #{wait_time.round} seconds"
  @@timer = EventMachine::Timer.new(wait_time) { calculate_next_execution }
  @@next_execution = next_execution
end

def calculate_next_execution
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
      run_tasks
    else
      possibly_add_next_execution task.next_execution
    end
  else
    p "No task, just waiting"
    @@timer = EventMachine::Timer.new(300) { calculate_next_execution } unless @@timer
  end
end

Thread.start do
  EventMachine.run do
    begin
      run_tasks
    rescue Exception => e
      p e
    end
  end
end
