'use strict';

var PassThrough = require('stream').PassThrough;

function deferred(fn) {
    var str = new PassThrough({
        objectMode: true
    });
    fn(str);
    return str;
}

function Pool(orapool){
    this._pool = orapool;
}

Pool.prototype.getConnection = function () {
    return this._pool.getConnection.apply(this._pool, arguments);
};

Pool.prototype.query = function (sql, binding, options) {
    return this.getConnection().then(conn => {
        var p = config.schema ? connection.execute('ALTER SESSION SET CURRENT_SCHEMA = ' + config.schema) : Promise.resolve();
        return p.then(() => {
            return connection.execute(sql, binding, options).then((rows) => {
                conn.close();
                return rows;
            });
        }).catch(err => {
            conn.close();
            return Promise.reject(err);
        });
    });
};

Pool.prototype.queryStream = function (sql, binding, options) {
    var args = arguments;
    var self = this;
    return deferred(function(str) {
        return self.getConnection().then((conn) => {
            var p = config.schema ? connection.execute('ALTER SESSION SET CURRENT_SCHEMA = ' + config.schema) : Promise.resolve();
            p.then(() => {
                var stream = connection.queryStream.apply(connection, args);
                closeConnection(stream);
                stream.pipe(str);
            }).catch(err => {
                conn.close();
                return Promise.reject(err);
            });
        }).catch((err) => {
            str.emit('error', err);
        });
    });
};

module.exports = function(oracledb) {
    var api = {};
    
    /**
     * Return a single db pool instance
     * @param  {Object} config
     * @return {Promise}
     */
    api.createPool = function(config) {
        return oracledb.createPool(config)
        .then(function(pool) {
            return new Pool(pool);
        });
    };
    
    /**
     * Return all the db pools defined in options
     * @param {Object} options
     * @return {Promise}
     */
    api.createPools = function(options) {
        var promises = [];
        var pools = [];
        var res = {
            oradb: {},
            onDestroy: function () {
                pools.forEach(function (p) {
                    p.close();
                });
            }
        };
        if (options.url) {
            var promise = api.createPool(options.url)
            .then(function(db) {
                res.oradb = db;
                pools.push(res.oradb._pool);
            });
            promises.push(promise);
        }
        Object.keys(options).forEach(function (key) {
            if (options[key] && options[key].url) {
                var promise = api.createPool(options[key].url)
                .then(function(db) {
                    res.oradb[key] = db;
                    pools.push(res.oradb[key]._pool);
                });
                promises.push(promise);
            }
        });
    
        return Promise.all(promises)
        .then(function(dbs) {
            return res;
        });
    };
};