'use strict';

var oracledb = require('oracledb'),
    orapool = require('./orapool');

module.exports = function setup(options, imports, register) {

    // Create the pools
    oracledb.createPools(oracledb, options)
    .then(function(pools) {
        register(null, pools);
    }).catch(register);
};

module.exports.provides = ['oradb'];