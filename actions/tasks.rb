class HTTPCron < Sinatra::Base

  get '/tasks.json' do
    content_type :json
    Task.all.to_json
  end

  post '/tasks.json' do
    check_parameter_for_blank :name, :url, :cron, :user_id

    user = User.where(:id => params[:user_id]).first
    unless user
      halt 500, "User with id [#{params[:user_id]}] not found"
    end

    t = Task.new(:user => user,
                 :name => params[:name],
                 :url => params[:url],
                 :cron => params[:cron],
                 :timezone => (params[:timezone] || user.timezone),
                 :enabled => (params[:enabled] || true))

    unless t.valid?
      halt 500, t.errors.values.join("\n")
    end

    begin
      t.save
    rescue Exception => e
      halt 500, e.message
    end

    content_type :json
    t.to_json
  end

end