require_relative 'helper'

describe 'execution edition' do

  def app
    HTTPCron::ApiServer
  end

  before do
    authorize_admin
  end

  it 'can fetch an execution' do
    database.transaction do

      create_valid_task
      last_response.status.must_equal 200
      task_id = last_response_id
      create_valid_execution task_id
      get "/executions/#{last_response_id}"
      last_response.status.must_equal 200
      last_response.json_body['task_id'].must_equal task_id

      raise(Sequel::Rollback)
    end
  end

  it 'can delete an execution' do
    database.transaction do

      create_valid_task
      last_response.status.must_equal 200
      task_id = last_response_id
      create_valid_execution task_id

      get "/executions/#{last_response_id}"
      last_response.status.must_equal 200
      execution_id = last_response_id

      delete "/executions/#{execution_id}"
      last_response.status.must_equal 200

      get "/executions/#{execution_id}"
      last_response.status.must_equal 404

      raise(Sequel::Rollback)
    end
  end

  it 'can list executions by task' do
    database.transaction do

      create_valid_task
      last_response.status.must_equal 200
      task_id = last_response_id

      create_valid_execution task_id, 200
      create_valid_execution task_id, 404

      get "/executions/task/#{task_id}"
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 2

      get "/executions/task/#{task_id}/success"
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 1
      last_response.json_body['records'][0]['status'].must_equal 200

      get "/executions/task/#{task_id}/failure"
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 1
      last_response.json_body['records'][0]['status'].must_equal 404

      raise(Sequel::Rollback)
    end
  end

  it 'can list executions by current user' do
    database.transaction do

      get '/users/current'

      create_valid_task
      last_response.status.must_equal 200
      task_id = last_response_id

      create_valid_execution task_id, 200
      create_valid_execution task_id, 404

      get '/executions/user/current'
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 2

      get '/executions/user/current/success'
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 1
      last_response.json_body['records'][0]['status'].must_equal 200

      get '/executions/user/current/failure'
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 1
      last_response.json_body['records'][0]['status'].must_equal 404

      raise(Sequel::Rollback)
    end
  end

  it 'can list executions by user' do
    database.transaction do

      get '/users/current'
      user_id = last_response_id

      create_valid_task
      last_response.status.must_equal 200
      task_id = last_response_id

      create_valid_execution task_id, 200
      create_valid_execution task_id, 404

      get "/executions/user/#{user_id}"
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 2

      get "/executions/user/#{user_id}/success"
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 1
      last_response.json_body['records'][0]['status'].must_equal 200

      get "/executions/user/#{user_id}/failure"
      last_response.status.must_equal 200
      last_response.json_body['records'].length.must_equal 1
      last_response.json_body['records'][0]['status'].must_equal 404

      raise(Sequel::Rollback)
    end
  end
  it 'cannot see executions of non admin users' do
    database.transaction do

      get '/users/current'
      user_id = last_response_id

      create_valid_task
      last_response.status.must_equal 200
      task_id = last_response_id
      create_valid_execution task_id
      last_response.status.must_equal 200
      execution_id = last_response_id

      create_non_admin_user_authenticate

      get "/executions/#{execution_id}"
      last_response.status.must_equal 403

      get "/executions/task/#{task_id}"
      last_response.status.must_equal 403
      get "/executions/task/#{execution_id}/success"
      last_response.status.must_equal 403
      get "/executions/task/#{execution_id}/failure"
      last_response.status.must_equal 403

      get "/executions/user/#{user_id}"
      last_response.status.must_equal 403
      get "/executions/user/#{user_id}/success"
      last_response.status.must_equal 403
      get "/executions/user/#{user_id}/failure"
      last_response.status.must_equal 403

      delete "/executions/#{task_id}"
      last_response.status.must_equal 403

      raise(Sequel::Rollback)
    end

  end

end
