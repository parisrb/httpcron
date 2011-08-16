require 'em-http'
require 'iconv'

# Code common to both engines

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
def response_content http
  response = http.response[0...4000]
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