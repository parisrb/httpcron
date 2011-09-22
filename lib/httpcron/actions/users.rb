module HTTPCron

  class ApiServer < Sinatra::Base

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

    get '/users/?' do
      check_admin
      apply_list_params(User, USERS_LIST_ORDER_FIELDS, USERS_LIST_ORDER_REGEX)
    end

    get '/users/current' do
      content_type :json
      current_user.to_json
    end

    get /\/users\/(\d+)/ do |id|
      check_admin
      if current_user.id != id
        user = User[id]
        unless user
          halt 404, "user [#{id}] does not exist"
        end
        content_type :json
        user.to_json
      else
        content_type :json
        current_user.to_json
      end

    end

    get /\/user\/password\/(.+)/ do |email_address|
      user = User[:email_address => email_address]
      unless user
        halt 404, "No user found with email address [#{email_address}]"
      end
      generate_new_password user
    end

    post '/users' do
      check_admin
      check_parameter_for_blank :username, :password, :email_address
      user = User.new(:username => params[:username],
                      :admin => 'true' == params[:admin],
                      :timezone => (params[:timezone] || Config.server_timezone),
                      :password => params[:password],
                      :email_address => params[:email_address])

      save_user user
    end

    put /\/users\/(\d+)/ do |id|
      id = id.to_i
      if (id != current_user.id) && (!current_user.admin)
        halt 403, "user [#{id}] is not allowed to you"
      end

      user = User[id]
      unless user
        halt 404, "user [#{id}] not found"
      end

      if params[:username] && (params[:username] != user.username) && (!params[:password])
        halt 400, 'can\'t change the username without changing the password'
      end

      [:username, :password, :timezone].each do |p|
        if params[p]
          if params[p].blank?
            halt 422, "#{p} is blank"
          else
            user[p] = params[p]
          end
        end
      end

      if params[:admin] && (params[:admin] != user.admin.to_s)
        if !current_user.admin
          halt 403, 'only admins can change the admin status'
        end
        user.admin = params[:admin]
      end

      user.hash_password! if params[:password]

      save_user user
    end

    delete /\/users\/(\d+)/ do |id|
      check_admin || current_user.id == id
      user = User[id]
      unless user
        halt 404, "user [#{id}] does not exist"
      end
      begin
        user.destroy
      rescue Exception => e
        halt 500, e.message
      end
      content_type :json
      halt 200
    end

    private

    def save_user(user, &after_save)
      unless user.valid?
        halt 422, user.errors.full_messages.join("\n")
      end

      begin
        user.save
      rescue Exception => e
        halt 500, e.message
      end

      after_save.call if after_save

      content_type :json
      user.to_json
    end

    def generate_new_password(user)
      new_password = KeePass::Password.generate 'cdszC{6}'
      user.password = new_password
      user.hash_password!
      save_user(user) { send_new_password user, new_password }
    end

    def send_new_password(user, new_password)
      user_name = user.username
      body = ERB.new(File.new('lib/httpcron/views/password_mail.erb').read).result(binding)
      Mail.deliver do
        from    Config.sender_email_address
        to      user.email_address
        subject 'Your httpcron password'
        body    body
      end
    end

    USERS_LIST_ORDER_FIELDS = [:id, :username, :admin, :timezone, :created_at, :updated_at]
    USERS_LIST_ORDER_REGEX = create_order_regex(USERS_LIST_ORDER_FIELDS)

  end

end
