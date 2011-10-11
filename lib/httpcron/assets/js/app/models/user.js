//= require ./model

HttpCron.User = SC.Object.extend({

  resourceUrl: '/api/users',
  resourceListBinding: 'HttpCron.UsersList',

  // Attributes
  username: '',
  admin: false,
  password: '',

  toJSON: function() {
    return {
      username: this.get('username'),
      admin: this.get('admin'),
      password: this.get('password')
    };
  }
});
