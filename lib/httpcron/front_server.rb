module HTTPCron

  class FrontServer < Sinatra::Base

    set :views, File.dirname(__FILE__) + '/views'
    set :public, File.dirname(__FILE__) + '/public'
    set :raise_errors, true
    set :dump_errors, true

    configure :development do
      set :show_exceptions, :true
      set :logging, true
    end

    get '/' do
      slim :index
    end

    helpers do
      def javascript_incudes
        html = ''
        if development?
          require 'yaml'
          assets = YAML::load(File.read(File.dirname(__FILE__) + '/assets.yml'))
          assets['javascripts']['application'].each do |file|
            html += '<script src="'+file.gsub(/^public/, '')+'" type="text/javascript"></script>'
          end
        else
          html = '<script src="assets/application.js" type="text/javascript"></script>'
        end
        html
      end
    end

  end

end
