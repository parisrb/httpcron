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
  p "Running tasks"
  Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |t|
    run_task t
  end
  tick
end

@@tick = nil

def tick
  p "tick"
  next_task = Task.filter('enabled = ? and id not in ?', true, RUNNING_TASKS.keys).order(:next_execution.asc).first
  if next_task
    now = DateTime.now
    if task.next_execution < now
      # execution date is passed: run tasks
      run_tasks
    else
      # execution date in the future, wait till the moment is here
      @@tick.cancel if @@tick
      wait_time = (task.next_execution - now) * SECONDS_IN_A_DAY
      p "Will wait #{wait_time}"
      @@tick = EventMachine::add_timer(wait_time){tick}
    end
  else
    # no next execution, so just wait a bit
    unless @@tick
      @@tick = EventMachine::add_timer(300){tick}
    end
  end
end

if ENV['START_ENGINE']
  Thread.start do
    EventMachine.run do
      run_tasks
    end
  end
end
