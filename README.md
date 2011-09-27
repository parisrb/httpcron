# httpcron is a ruby server to cron http requests

- simple user managment
- requests' executions are recorded
- administration can be done using a webapp, a REST API or the [httpcron-client gem](https://github.com/parisrb/httpcron-client)
- http requests use asynchronous IO enabling a very low resource usage
- storage use [sequel](http://sequel.rubyforge.org/) so most of popular SQL databases are supported
- code is kept simple to be easily adapted

# Causes:

- existing http cron capabilities of hosting providers are very limited
- existing classic schedulers use threads and are not adapted to http requests and/or lack an admin part

# Fast Installation

- install ruby 1.9.2
- install the httpcron gem: `gem install httpcron`
- go to the directory where you want to install the server
- create a `config.ru` file:

``` ruby
# Setup the database url, see http://sequel.rubyforge.org/rdoc/files/doc/opening_databases_rdoc.html for details
ENV['DATABASE_URL'] = "sqlite://#{Dir.pwd}/httpcron.sqlite3"

require 'httpcron'

# Start the engine
HTTPCron::Engine.start_engine

# Start the server
run Rack::URLMap.new(
{
  "/" => HTTPCron::FrontServer,
  "/api" => HTTPCron::ApiServer
  }
)
```

- (optional) add other configuration items, see HTTPCron::Config
- run `rackup -E production`
- start your browser and go to [http://localhost:9292](http://localhost:9292)
- the default login / password is `httpcronadmin` / `httpcronadmin`

# API

- § indicates a method that requires admin rights
- # indicates a value that can be configured in HTTPCron::Config

The API use json data and require the digest authentication method, most http query tool should support it natively, example with curl:

``` console
curl --digest --user httpcronadmin:httpcronadmin http://localhost:9292/api/users
```

### Pagination

All methods returning a list of data are paginated thus the results looks like:

``` javascript
{"total":XXX,"records":[  // data ]}
```

Pagination parameters:

- `limit` the page size aka the max number of records to return, default and max value is 100#
- `page` index of the page to return

### Ordering

By default API returning lists are sorted by id desc, to use another order use the `order` parameter, the syntax is

```
    order=field_name[(.asc|.desc)]
```

where

- field_name is the name of the field you want to use for sorting
- .asc and .desc can define the sort direction, .desc being the default

Thus if you want to list the users ordered by their ascending username:

``` console
curl --digest --user httpcronadmin:httpcronadmin http://localhost:9292/api/users?sort=username.asc
```

## Users

### get /api/users/:id §
Get the user with the corresponding id

``` javascript
{
"id":1,
"username":"httpcronadmin",
"admin":true,
"timezone":"UTC", // default timezone for the user's tasks
"created_at":"2011-08-16T16:54:02+00:00",
"updated_at":"2011-08-16T16:54:02+00:00",
"email_address":"admin@example.com"
}
```


### get /api/users §
List all the users

### get /api/users/current
Get the current user

### post /api/users §
Create a user, parameters:

- `username` mandatory, max size 250, unique
- `password` mandatory
- `email_address` mandatory
- `admin` optional, default to false
- `timezone` optional, default to "UTC" #

### delete /api/users/:id
Delete the user with the corresponding id, admin users can delete anybody, non-adminc an only delete themselves. Deleting a user delete all his tasks.

## Tasks

### get /api/tasks/:id
Get the task with the corresponding id, non-admin users can only access their own tasks

``` javascript
{
  "id":1,
  "name":"FancyTask",
  "url":"http://localhost:9292/",
  "timeout":60,
  "enabled":false,
  "cron":"0 0 1 1 *",
  "timezone":"UTC",
  "next_execution":"2012-01-01T00:00:00+00:00", // only available if task is enabled
  "created_at":"2011-08-16T16:56:22+00:00",
  "updated_at":"2011-08-16T16:56:22+00:00"
}
```

### get /api/tasks
Get the tasks for the current user

### get /api/tasks/user/:id §
Get the tasks for the user with the specified id

### post /api/tasks
Create a task, parameters:

- `name` mandatory, max size to 250
- `url` mandatory, max size to 250
- `cron` mandatory, the cron expression
- `timeout` optional, in seconds, default to 60#, max to 300#
- `enabled` optional, default to false
- `timezone` optional, default to the user's timezone

### put /api/tasks/:id
Edit the task with the specified id, non-admin users can only edit their own tasks, see above for parameters list, you can omit parameters that don't change

### delete /api/tasks/:id
Delete the task with the specified id, non-admin users can only delete their own tasks

## Executions

### get /api/executions/:id
Get the execution with the corresponding id, non-admin users can only access the executions of their own tasks

``` javascript
{
  "id":1,
  "status": 200,
  "started_at": "2011-08-16T16:56:22+00:00",
  "url":"http://localhost:9292/",
  "duration": 3 // in seconds
  "response": "Ho-hai !" // limit to 5000
}
```

### get /api/executions/task/:id
Get the executions of the task with the corresponding id, non-admin users can only access the executions of their own tasks

### get /api/executions/task/:id/failure
Get the failed executions of the task with the corresponding id, non-admin users can only access the executions of their own tasks

### get /api/executions/task/:id/success
Get the successful executions of the task with the corresponding id, non-admin users can only access the executions of their own tasks

### get /api/executions/user/:id
Get the executions of the tasks owned by the current user

### get /api/executions/user/:id/failure
Get the failed executions of the tasks owned by the current user

### get /api/executions/user/current/success
Get the successful executions of the tasks owned by the current user

### get /api/executions/user/:id
Get the executions of the tasks owned by the user with the corresponding id, non-admin users can only access the executions of their own tasks

### get /api/executions/user/:id/failure
Get the failed executions of the tasks owned by the user with the corresponding id, non-admin users can only access the executions of their own tasks

### get /api/executions/user/:id/success
Get the successful executions of the tasks owned by the user with the corresponding id, non-admin users can only access the executions of their own tasks

### delete /api/executions/:id
Get the execution with the corresponding id, non-admin users can only delete the executions of their own tasks

### get /user/password/:email
Reset the password and send a new password by email

### get /config
Get some server config

## Server config

``` javascript
{
  "server_timezone": "UTC",
  "default_timeout": 60,
  "max_timeout": 300,
  "max_pagination_limit": 100
}
```

# Copyright
- Copyright : 2011 Paris.rb
- Authors : Julien Kirch [archiloque], Paul Chavard [tchak], Vincent Viaud
- Released under the MIT license
