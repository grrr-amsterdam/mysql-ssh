# MySQL SSH

Sets up a MySQL connection inside an SSH tunnel.
This is practical when you want to reach a database which is only accessible through a webserver.
Even if the database server is not located on the webserver itself.

[![Greenkeeper badge](https://badges.greenkeeper.io/grrr-amsterdam/mysql-ssh.svg)](https://greenkeeper.io/)


## API

### `.connect(obj sshConfig, obj dbConfig)`

* `sshConfig` should be an object according to the `ssh2` package.
* `dbConfig` should be an object according to the `mysql2` package.
* Returns a Promise, containing a connection from the `mysql2` package.


## Usage
Don't forget to `.close()` the tunnel connection when you're done querying the database.

```javascript
const mysqlssh = require('mysql-ssh');
const fs = require('fs');

mysqlssh.connect(
    {
        host: 'my-ssh-server.org',
        user: 'me-ssh',
        privateKey: fs.readFileSync(process.env.HOME + '/.ssh/id_rsa')
    },
    {
        host: 'my-db-host.com',
        user: 'me-db',
        password: 'secret',
        database: 'my-db-name'
    }
)
.then(client => {
    client.query('SELECT * FROM `users`', function (err, results, fields) {
        if (err) throw err
        console.log(results);
        mysqlssh.close()
    })
})
.catch(err => {
    console.log(err)
})
```
