const PassThrough = require('stream').PassThrough;

/**
 * @typedef {Object} PoolConfig
 * @property {string} user
 * @property {string} password
 * @property {string} connectString
 * @property {number} [poolMin]
 * @property {number} [poolMax]
 * @property {number} [poolIncrement]
 */

/**
 * @typedef {Object} PoolInstance
 * @property {function(string, any, any): Promise<any>} query
 * @property {function(...any): PassThrough} queryStream
 * @property {Object} _pool
 * @property {PoolConfig} _config
 */

/**
 * @typedef {Object} OraclePoolApi
 * @property {function(PoolConfig): Promise<PoolInstance>} createPool
 * @property {function(Object): Promise<{ oradb: Object, onDestroy: function():void }>} createPools
 */

/**
 * Create a deferred stream
 * @param {function(PassThrough):void} fn
 * @returns {PassThrough}
 */
function deferred(fn) {
    const str = new PassThrough({
        objectMode: true
    });
    fn(str);
    return str;
}

/**
 * Oracle Pool wrapper
 * @param { import('oracledb').Pool } orapool
 * @param { PoolConfig } config
 * @constructor
 */
function Pool(orapool, config){
    /**
     * @type { import('oracledb').Pool }
     */
    this._pool = orapool;
    /**
     * @type { PoolConfig }
     */
    this._config = config;
}

/**
 * Execute a SQL query
 * @param {string} sql
 * @param {any} binding
 * @param {any} options
 * @returns {Promise<any>}
 */
Pool.prototype.query = function (sql, binding, options) {
    return this._pool.getConnection().then(conn => {
        return conn.execute(sql, binding, options).then((rows) => {
            conn.release();
            return rows;
        }).catch(err => {
            conn.release();
            return Promise.reject(err);
        });
    });
};

/**
 * Execute a SQL query and return a stream
 * @returns {PassThrough}
 */
Pool.prototype.queryStream = function (/* sql, binding, options */) {
    var args = arguments;
    return deferred((str) => {
        return this._pool.getConnection().then((conn) => {
            let stream = conn.queryStream.apply(conn, args);
            stream.once('error', (err) => {
                conn.release();
                str.emit(err);
            })
            stream.once('end', () => {
                // console.log("stream 'end' event"); // all data has been fetched
                stream.destroy();                     // clean up resources being used
            });
            stream.pipe(str);
        }).catch((err) => {
            str.emit('error', err);
        });
    });
};

/**
 * Oracle Pool API factory
 * @param {Object} oracledb
 * @returns {OraclePoolApi}
 */
module.exports = function(oracledb) {
    var api = {};
    
    /**
     * Return a single db pool instance
     * @param  {PoolConfig} config
     * @return {Promise<PoolInstance>}
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
     * @return {Promise<{ oradb: Object, onDestroy: function():void }>}
     */
    api.createPools = function(options) {
        var promises = [];
        var pools = [];
        
        if(!options.pools)
            return Promise.reject(new Error('No pools property'));

        Object.keys(options.pools).forEach((key) => {
            if(options.pools[key]) {
                var promise = api.createPool(options.pools[key])
                    .then(function(db) {
                        pools.push(db._pool);
                        var res = {};
                        res[key] = db;
                        return res;
                    });
                promises.push(promise);
            }
            else {
                promises.push(Promise.reject(new Error('Invalid pool config')));
            }
        });
    
        return Promise.all(promises)
            .then(function(dbs) {
                let objDb = {};
                dbs.map(x => { objDb = { ...objDb, ...x }; });
                return {
                    oradb: objDb,
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
