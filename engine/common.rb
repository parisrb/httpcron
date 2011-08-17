require 'em-http'
require 'iconv'

# Code common to both engines
SECONDS_IN_A_DAY = 24 * 60 * 60

# reschedule tasks whose execution date is in the past
def reschedule_tasks
  count = 0
  from = Time.now

  database.transaction do
    Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |task|
      task.recalculate_cron(from)
      task.save
      count += 1
    end
  end
  p "#{count} task(s) rescheduled"
end

# Get the charset of a response
# http:: the http request
def response_charset http
  type = http.response_header[EventMachine::HttpClient::CONTENT_TYPE]
  if type
    match = /.+;\s*charset=(.+)/i.match(type)
    if match
      match[1].upcase
    end
  end
end

# Get the content of the response in a way suitable for the database
def response_content http, content
  response = content[0...4000]
  charset = response_charset http
  if charset && (charset != 'UTF-8')
    begin
      Iconv.new(charset, 'UTF-8').iconv(response)
    rescue Exception
      response
    end
  else
    response
  end

end