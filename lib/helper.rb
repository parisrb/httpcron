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

class HTTPCronApi < Sinatra::Base

  private

  # Check if the current user is an admin
  # raise a 403 elsewhere
  def check_admin
    unless current_user.admin
      halt 403
    end
  end

  # Create a regex to match the ordering parameters
  def self.create_order_regex fields
    Regexp.new "\\A(#{fields.join('|')})(\\.asc|\\.desc|)\\z"
  end

  # Apply the parameters used in list requests to a dataset and return the result
  # dataset:: the dataset to add the parameters to
  # order_fields:: the list of fileds that can be used to order the data
  # order_regex:: the regex created by #create_order_regex from the order_fields
  def apply_list_params dataset, order_fields, order_regex
    if params[:limit]
      limit = params[:limit].to_i
      if limit <= 0
        halt 422, "Limit is [#{limit}] but shouldn't be <= 0"
      elsif limit > HttpCronConfig.max_pagination_limit
        halt 422, "Limit is [#{limit}] but should be <= #{HttpCronConfig.max_pagination_limit}"
      end
    else
      limit = 100
    end

    if params[:offset]
      offset = params[:offset].to_i
      if offset < 0
        halt 422, "Offset is [#{offset}] but shouldn't be < 0"
      end
      offset += 1
    else
      offset = 1
    end

    if params[:order]
      unless v = order_regex.match(params[:order])
        halt 422, "[#{params[:order]}] order parameter is invalid, allowed fields are [#{order_fields.join(',')}], allowed directions are [asc,desc]"
        return
      else
        order = "#{v[1]} #{v[2].blank? ? 'desc' : v[2]}"
      end
    else
      order = "id desc"
    end

    dataset = dataset.order(order).paginate(offset, limit)
    content_type :json
    {:total => dataset.pagination_record_count, :records => dataset}.to_json
  end

  def check_parameter_for_blank *params_names
    params_names.each do |param_name|
      if params[param_name]
        if params[param_name].blank?
          halt 422, "Parameter [#{param_name}] is blank"
        end
      else
        halt 422, "No [#{param_name}] parameter"
      end
    end
  end

end
