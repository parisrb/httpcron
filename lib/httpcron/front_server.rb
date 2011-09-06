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
      serve '/js',     from: 'app/js'
      serve '/css',     from: 'app/css'

      js :application, '/js/application.js', [
        '/js/vendor/jquery.js',
        '/js/vendor/jquery-ui.js',
        '/js/vendor/sproutcore.js',
        '/js/vendor/sproutcore-jui.js',
        '/js/vendor/bricks/toggle_view.js',
        '/js/vendor/**/*.js',
        '/js/app/main.js',
        '/js/app/**/*.js'
      ]

      css :application, '/css/application.css', ['/css/style.css']

      css_compression :sass
    end

    get '/' do
      slim :index
    end

  end

end
