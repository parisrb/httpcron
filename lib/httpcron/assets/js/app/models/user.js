HC.User = HC.Record.extend({

  resourceUrl: '/api/users',
  resourceListBinding: 'HC.UsersList',

  // Attributes
  username: '',
  admin: false,
  password: '',
  email_address: '',

  toJSON: function() {
    return {
      username: this.get('username'),
      admin: this.get('admin'),
      password: this.get('password')
    };
  }
});
