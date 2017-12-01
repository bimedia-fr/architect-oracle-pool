/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

var oraclepool = require('../src/index');

var URI = {
    "user": "PREPROD3",
    "password": "oracle",
    "url": "bimedia-possm.lan/XE"
};

function assertPool(pool, test) {
    test.ok(pool, 'pool is defined');
    test.equal(typeof pool['_pool'], 'object', 'pool has a _pool object');
}
module.exports = {
    testDefaultPool: function (test) {
        oraclepool({
            url: URI
        }, {}, function (err, res) {
            test.ok(res.oradb,, 'exports a *oracledb* object to architect');
            assertPool(res.oradb,, test);
            test.done();
        });
    },
    testInvalidUrlPool: function (test) {
        oraclepool({
            url: {
                "user": "PREPROD3",
                "password": "oracle",
                "url": "ssssssssssssssssss/XE"
            }
        }, {}, function (err, res) {
            res.oradb._pool.getConnection(function (err) {
                test.ok(err, 'could not resolve the connect identifier specified');
                test.done();
            });
        });
    },
    testMultiPool: function (test) {
        oraclepool({
            first: {
                url: URI
            },
            second: {
                url: URI
            }
        }, {}, function (err, res) {

            test.ok(res.oradb, 'exports a *oracledb* object to architect');
            assertPool(res.oradb.first, test);
            assertPool(res.oradb.second, test);
            test.ok(!res.oradb.connection, 'there is no *default* pool : *oracledb.connection* is not available');
            test.done();
        });
    },
    testMultiPoolWithDefault: function (test) {
        oraclepool({
            first: {
                url: URI
            },
            second: {
                url: URI,
                "default": true
            }
        }, {}, function (err, res) {

            test.ok(res.oradb, 'exports a *oracledb* object to architect');
            assertPool(res.oradb.first, test);
            assertPool(res.oradb.second, test);
            assertPool(res.oradb, test);
            test.done();
        });
    }
};
