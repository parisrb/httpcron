module HTTPCron

  class FrontServer < Sinatra::Base

    set :root, File.dirname(__FILE__)
    set :raise_errors, true
    set :dump_errors, true

    configure :development do
      set :show_exceptions, :true
      set :logging, true
    end

    register Sinatra::AssetPack

    assets do
      serve '/js', from: 'assets/js'
      serve '/css', from: 'assets/css'

      js :application, '/js/application.js',
         [
            '/js/vendor/jquery.js',
            '/js/vendor/sproutcore.js',
            '/js/vendor/sproutcore-datetime.js',
            '/js/vendor/sproutcore-ui.js',
            '/js/vendor/**/*.js',
            '/js/app/main.js',
            '/js/app/models/*.js',
            '/js/app/controllers/*.js',
            '/js/app/**/*.js'
         ]

      css :application, '/css/application.css',
          [
            '/css/normalize.css',
            '/css/bootstrap.css',
            '/css/style.css'
          ]

      css_compression :sass
    end

    get '/' do
      slim :index
    end

  end

end
