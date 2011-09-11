class Object

  # An object is blank if it's false, empty, or a whitespace string.
  # For example, "", "   ", +nil+, [], and {} are blank.
  #
  # This simplifies:
  #
  #   if !address.nil? && !address.empty?
  #
  # ...to:
  #
  #   if !address.blank?
  def blank?
    respond_to?(:empty?) ? empty? : !self
  end

end

# Monkey patch Rack to work with xhr digest
module Rack
  module Auth
    module Digest
      class MD5 < AbstractHandler

        alias :org_call :call

        def call(env)
          @requested_with = env['HTTP_X_REQUESTED_WITH']
          org_call(env)
        end

        def xhr?
          @requested_with == 'XMLHttpRequest'
        end

        private

        def unauthorized(www_authenticate = challenge)
          headers = {'Content-Type' => 'text/plain', 'Content-Length' => '0'}
          if xhr?
            headers['X-WWW-Authenticate'] = www_authenticate.to_s
          else
            headers['WWW-Authenticate'] = www_authenticate.to_s
          end
          return [401, headers, []]
        end
      end
    end
  end
end
