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
 * @property {function(...any): import('stream').Readable} queryStream
 * @property {Object} _pool
 * @property {PoolConfig} _config
 */

/**
 * @typedef {Object} OraclePoolApi
 * @property {function(PoolConfig): Promise<PoolInstance>} createPool
 * @property {function(Object): Promise<{ oradb: Object, onDestroy: function():void }>} createPools
 */

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
    return this._pool.getConnection().then(cnx => {
        return cnx.execute(sql, binding, options).then((rows) => {
            cnx.close();
            return rows;
        }).catch(err => {
            cnx.close();
            return Promise.reject(err);
        });
    });
};

/**
 * Execute a SQL query and return a stream
 * @param {string} sql
 * @param {any} binding
 * @param {object} options
 * @returns {Promise<import('stream').Readable>}
 */
Pool.prototype.queryStream = async function (sql, binding, options) {
    return this._pool.getConnection()
        .then((cnx) => {
            let stream = cnx.queryStream(sql, binding, options);
            stream.on('end', () => {
                stream.destroy(); 
            });
            // pass here in all cases err etc ...
            stream.on('close', async () => {
                await cnx.close();
            });
            stream.on('error', () => {});
            return stream;
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
                            p.close(options.poolsDrainTime || 10);
                        });
                    }
                }
            });
    };

    return api;
};
