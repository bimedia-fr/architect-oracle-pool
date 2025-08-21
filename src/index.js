'use strict';

var oracledb = require('oracledb'),
    orapool = require('./orapool');

/**
 * @typedef {import('oracledb').Pool} oradb
 */

/**
 * @typedef {import('./orapool').PoolConfig} PoolConfig
 * @typedef {import('./orapool').PoolInstance} PoolInstance
 * @typedef {Object} OraclePoolModuleOptions
 * @property {Object.<string, { url: PoolConfig }>} [databases] Liste des pools à créer
 * @property {{ url: PoolConfig }} [url] Pool principal
 */

/**
 * @typedef {Object} OraclePoolModuleExport
 * @property {Object.<string, PoolInstance>} oradb
 * @property {function():void} onDestroy
 */

/**
 * Initialise le module OraclePool
 * @param {OraclePoolModuleOptions} options
 * @param {Object} imports
 * @param {function(Error|null, OraclePoolModuleExport|null):void} register
 */
module.exports = function setup(options, imports, register) {
    //set default output format to Object
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    // Create the pools
    orapool(oracledb).createPools(options)
        .then(function(pools) {
            register(null, pools);
        }).catch(error => {
            if(error instanceof Error) {
                register(error, null);
            } else {
                register(new Error('Error'), null);
            }
        });
};

module.exports.provides = ['oradb'];
