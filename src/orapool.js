'use strict';

var PassThrough = require('stream').PassThrough;

function deferred(fn) {
    var str = new PassThrough({
        objectMode: true
    });
    fn(str);
    return str;
}

function Pool(orapool, config){
    this._pool = orapool;
    this._config = config;
}

Pool.prototype.query = function (sql, binding, options) {
    return this._pool.getConnection().then(conn => {
        var p = this._config.schema ? conn.execute('ALTER SESSION SET CURRENT_SCHEMA = ' + this._config.schema) : Promise.resolve();
        return p.then(() => {
            return conn.execute(sql, binding, options).then((rows) => {
                conn.release();
                return rows;
            });
        }).catch(err => {
            conn.release();
            return Promise.reject(err);
        });
    });
};

Pool.prototype.queryStream = function (sql, binding, options) {
    var args = arguments;
    var self = this;
    return deferred(function(str) {
        return this._pool.getConnection().then((conn) => {
            var p = this._config.schema ? conn.execute('ALTER SESSION SET CURRENT_SCHEMA = ' + this._config.schema) : Promise.resolve();
            p.then(() => {
                var stream = conn.queryStream.apply(conn, args);
                closeConnection(stream);
                stream.pipe(str);
            }).catch(err => {
                conn.release();
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
            return new Pool(pool, config);
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
        if (options.url) {
            var promise = api.createPool(options.url)
            .then(function(db) {
                pools.push(db._pool);
                return db;
            });
            promises.push(promise);
        }
        Object.keys(options).forEach((key) => {
            if (key != 'url' && options[key] && options[key].url) {
                var promise = api.createPool(options[key].url)
                .then(function(db) {
                    pools.push(db._pool);
                    var res = {};
                    res[key] = db;
                    return res;
                });
                promises.push(promise);
            }
        });
    
        return Promise.all(promises)
        .then(function(dbs) {
            return {
                oradb: Object.assign.apply(null, dbs),
                onDestroy: function () {
                    pools.forEach(function (p) {
                        p.close();
                    });
                }
            }
        });
    };

    return api;
};