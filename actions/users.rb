class HTTPCronApi < Sinatra::Base

  before do
    digest_header = @env['HTTP_AUTHORIZATION']
    tokens = digest_header.gsub('Digest', '').split(',')
    username = tokens.detect do |token|
      token.match(/^\s?username/)
    end
    if username
      username = username.split('=').pop.gsub('"', '')
      self.current_user = User.filter(:username => username).first
    end
  end

  USERS_LIST_ORDER_FIELDS = [:id, :username, :admin, :timezone, :created_at, :updated_at]
  USERS_LIST_ORDER_REGEX = create_order_regex(USERS_LIST_ORDER_FIELDS)

  get '/users/?' do
    check_admin
    apply_list_params(User, USERS_LIST_ORDER_FIELDS, USERS_LIST_ORDER_REGEX)
  end

  get '/users/current' do
    content_type :json
    current_user.to_json
  end

  get '/users/:id' do |id|
    check_admin
    if current_user.id != id
      user = User[id]
      unless user
        halt 404, "User [#{id}] does not exist"
      end
      content_type :json
      user.to_json
    else
      content_type :json
      current_user.to_json
    end

  end

  post '/users' do
    check_admin
    check_parameter_for_blank :username, :password
    user = User.new(:username => params[:username],
                    :admin => 'true' == params[:admin],
                    :timezone => (params[:timezone] || HttpCronConfig.server_timezone),
                    :password => params[:password])

    unless user.valid?
      halt 422, user.errors.values.join("\n")
    end

    begin
      user.save
    rescue Exception => e
      halt 500, e.message
    end

    content_type :json
    user.to_json
  end

  put '/users/:id' do |id|
    if (id != current_user.id) && (!current_user.admin)
      halt 403, "User [#{id}] is not allowed to you"
    end

    if params[:username] && (!params[:password])
      halt 400, 'Can\'t change the username without changing the password'
    end

    user = User[id]
    unless user
      halt 404, "User [#{id}] not found"
    end

    [:username, :password, :timezone].each do |p|
      if params[p]
        if params[p].blank?
          halt 422, "Parameter [#{p}] is blank"
        else
          user[p] = params[p]
        end
      end
    end

    if params[:admin]
      if !current_user.admin
        halt 403, "Only admins can change the admin status"
      end
      user.admin = params[:admin]
    end

    unless user.valid?
      halt 422, user.errors.values.join("\n")
    end

    begin
      user.save
    rescue Exception => e
      halt 500, e.message
    end

    content_type :json
    user.to_json
  end

  delete '/users/:id' do |id|
    check_admin || current_user.id == id
    user = User[id]
    unless user
      halt 404, "User [#{id}] does not exist"
    end
    begin
      user.destroy
    rescue Exception => e
      halt 500, e.message
    end
    content_type :json
    halt 200
  end

  head '/authenticate' do
    content_type :json
    halt 200
  end

  def self.new(*)
    app = Rack::Auth::Digest::MD5.new(super) do |username|
      user = User.filter(:username => username).first
      user.password if user
    end
    app.realm = 'CromagnonApi'
    app.opaque = '1hj540cdui23j43l3578nkm8634ruso5443lmg'
    app
  end

end
