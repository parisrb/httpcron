require 'em-http'
require 'iconv'

module HTTPCron

  module Engine

    # Code common to both engines
    SECONDS_IN_A_DAY = 24 * 60 * 60

    # reschedule tasks whose execution date is in the past
    def self.reschedule_tasks
      count = 0
      from = Time.now

      database.transaction do
        Task.filter('enabled = ? and next_execution <= ?', true, DateTime.now).each do |task|
          task.next_execution = task.calculate_next_execution(from)
          task.save
          count += 1
        end
      end
      p "#{count} task(s) rescheduled"
    end

    # Get the charset of a response
    # http:: the http request
    def self.response_charset http
      type = http.response_header[EventMachine::HttpClient::CONTENT_TYPE]
      if type
        match = /.+;\s*charset=(.+)/i.match(type)
        if match
          match[1].upcase
        end
      end
    end

    # Get the content of the response in a way suitable for the database
    def self.response_content http, content
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

    # Run a task
    # call a block with the http request, the result content and the start date
    def self.run_task task
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
        if block_given?
          yield(http, content, start)
        end
      end
      http.errback do
        if block_given?
          yield(http, content, start)
        end
      end
    end

    # Called when a task has ended
    # http:: the http request
    # content:: the response' content
    # start:: starting date
    # task:: the corresponding task
    def self.task_ended http, content, start, task
      p "Ending task #{task.id} [#{task.name}] : #{http.response_header.status}"
      Execution.create(:task => task,
                       :status => http.response_header.status,
                       :started_at => start,
                       :duration => (SECONDS_IN_A_DAY * (DateTime.now - start)).to_i,
                       :response => response_content(http, content))

    end
  end
end