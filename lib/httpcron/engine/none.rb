# empty engine for tests
module HTTPCron

  module Engine

    def self.notify_create_task task
    end

    def self.notify_delete_task task
    end

    def self.notify_update_task task
    end

    # Start the engine
    def self.start_engine
    end

  end
end