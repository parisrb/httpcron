class HTTPCronApi < Sinatra::Base

  get '/tasks/:id/executions' do |id|
    t = Task.find(id)
    unless t.user.admin || t.user == current_user
      halt 403, 'This Task do not belongs to you!'
    end
    content_type :json
    t.executions.to_json
  end

end
