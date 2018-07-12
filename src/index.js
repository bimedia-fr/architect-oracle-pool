'use strict';

var oracledb = require('oracledb'),
    orapool = require('./orapool');

module.exports = function setup(options, imports, register) {

    //set default output format to Object
    oracledb.outFormat = oracledb.OBJECT;
    // Create the pools
    orapool(oracledb).createPools(options)
    .then(function(pools) {
        register(null, pools);
    }).catch(register);
};

module.exports.provides = ['oradb'];