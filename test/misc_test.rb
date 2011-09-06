require_relative 'helper'

describe 'user basics' do

  def app
    HTTPCronApi
  end

  before do
    authorize_admin
  end

  it 'has a valid /config action' do
    database.transaction do
      get '/config'
      last_response.status.must_equal 200
      content = last_response.json_body

      content['server_timezone'].must_equal HttpCronConfig.server_timezone
      content['default_timeout'].must_equal HttpCronConfig.default_timeout
      content['max_timeout'].must_equal HttpCronConfig.max_timeout
      content['max_pagination_limit'].must_equal HttpCronConfig.max_pagination_limit
      content['valid_timezones'].must_equal TZInfo::Timezone.all_identifiers.join(', ')
      raise(Sequel::Rollback)
    end
  end

end
