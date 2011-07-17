# recron past tasks

SECONDS_IN_A_DAY = 24 * 60 * 60

# will recron in this much seconds for restarting
DELAY_FOR_RECRON = 3.0 * 60.0

count = 0
from = Time.now + DELAY_FOR_RECRON
Task.filter('enabled = ? and next_execution <= ?', true, (DateTime.now + (DELAY_FOR_RECRON / SECONDS_IN_A_DAY))).each do |t|
  t.recalculate_cron(from)
  t.save
  count += 1
end
p "#{count} task(s) rescheduled"

require 'eventmachine'

def run_task task
  p "Running task [#{task.name}]"
  start = DateTime.now
  http = EventMachine::HttpRequest.new(task.url).get :redirects => 5, :timeout => 600
  http.callback do
    Execution.create(:task => task,
                     :status => http.response_header.status,
                     :run_at => start,
                     :duration => (SECONDS_IN_A_DAY * (DateTime.now - start)).to_i,
                     :response => http.response[0...4000])
    from = Time.now
    from += 60 - from.sec
    task.recalculate_cron(from)
    task.save
  end
end

def run_tasks
  p "running"
  Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |t|
    run_task t
  end
end

# EventMachine.run do
#  EventMachine::add_periodic_timer(60) do
#    run_tasks
#  end
# end
