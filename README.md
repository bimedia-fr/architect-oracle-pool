architect-oracle-pool [![build status](https://secure.travis-ci.org/bimedia-fr/architect-oracle-pool.png)](https://travis-ci.org/bimedia-fr/architect-oracle-pool)
=================

Expose a Oracle connection pool as architect plugin. Automaticaly returns connection to the pool after query.

### Installation

```sh
npm install --save architect-oracle-pool
```

### Config Format
```js
module.exports = [{
    packagePath: "architect-oracle-pool",
    pools: {
        poolName: {
            user: 'scott',
            password: 'tiger',
            connectString: 'backend.local/X3PV7',
            poolMax: 10
        }
    }
}];
```
* `url` :  Defines the oracle url to use for connection


### Usage

Boot [Architect](https://github.com/c9/architect) :

```js
var path = require('path');
var architect = require("architect");

var configPath = path.join(__dirname, "config.js");
var config = architect.loadConfig(configPath);

architect.createApp(config, function (err, app) {
    if (err) {
        throw err;
    }
    console.log("app ready");
});
```

Configure Architect with `config.js` :

```js
module.exports = [{
    packagePath: "architect-oracle-pool",
    pools: {
        poolName: {
            user: 'scott',
            password: 'tiger',
            connectString: 'backend.local/PV7',
            poolMax: 10
        }
    }
}, './routes'];
```

Consume *oradb* plugin in your `./routes/package.json` :

```js
{
  "name": "routes",
  "version": "0.0.1",
  "main": "index.js",
  "private": true,

  "plugin": {
    "consumes": ["oradb"]
  }
}
```
Eventually use Oracle connection in your routes `./routes/index.js` :

```js
module.exports = function setup(options, imports, register) {
    var rest = imports.rest;
    var db = imports.oradb;

    // register routes 
    rest.get('/hello/:name', function (req, res, next) {
        db.query('SELECT * FROM Users WHERE id=$1', [req.params.name], function(err, res){
            res.write("{'message':'hello," + res.rows[0].name + "'}");
            res.end();
        });
    });
    
    register();
};
```
### Multiple pool configuration
This module supports multiple pools.

Here is how to define 2 different pools :
```js
module.exports = [{
    packagePath: "architect-oracle-pool",
    pools: {
        first: {
            user: 'scott',
            password: 'tiger',
            connectString: 'backend.local/PV7',
            poolMax: 10
        },
        second : {
            user: 'scott',
            password: 'tiger',
            connectString: 'backend2.local/PV7',
            poolMax: 10
        }
    }
}];
```

This will create 2 properties (`first` and `second`) in the `db` object.
```js
module.exports = function setup(options, imports, register) {
    var db = imports.oradb;
    db.first.connection(function (err, client) {
      client.query(/*...*/);
    });    
    register();
};
```

### Configuration

* `url` either a connection url or an object :
 * `host` : serveur hostname or ip
 * `port` : serveur port
 * `user` : username to login,
 * `password` : password to login,
 * `database`: database name,
 * `application_name`: a name to identify client,
 * `validationQuery`: a query to run to validate a connection
 
See Oracle [createPool](https://github.com/oracle/node-oracledb/blob/master/doc/api.md#createpool)


### API
The pool object (`oradb`) has the following methods :

#### connection
Retreive a connection from the pool. The method takes a callback as parameter. Once the connection is avaliable the callback is called with an :

* `err` object if an error occured or null;
* `client` the Oracle connection object;
* `done`, the close method.

#### query
The `query` method let you directly query the database without worrying about the database connection. Behind the scene the method retreive a connection from the pool and close it afterward.
* _string_ text: the query text;
* optional _array_ parameters: the query parameters;
* optional _function_ callback : the function called when data is ready.

Once the data is ready the callback is fired with an :

* `err` object if an error occured or null;
* `rows` the result set.

```js
module.exports = function setup(options, imports, register) {
    var db = imports.oradb;
    
    db.query('SELECT * from USERS', function (err, res) {
        res.rows.forEach(console.log);
    });
    //...
};
```

#### queryStream
The `queryStream` method let you directly query the database without worrying about the database connection. This method passes a stream to the callback instead of a resultset. 
* _string_ text: the query text;
* optional _array_ parameters: the query parameters;
* optional _function_ callback : the function called when stream is ready.
* returns: ReadableStream

Once the stream is ready the callback is fired with an :

* `err` object if an error occured or null;
* `stream` the result stream.

```js
var JSONSteam = require('JSONStream');

module.exports = function setup(options, imports, register) {
    var db = imports.oradb;
    db.queryStream('SELECT * from USERS')
        .pipe(JSONSteam.stringify())
        .pipe(process.stdout);
    //...
};
```