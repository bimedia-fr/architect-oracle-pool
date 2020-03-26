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
const assert = require('assert');
const oraclepool = require('../src/index');

var URI = {
    "user": "PREPROD3",
    "password": "oracle",
    "url": "bimedia-possm.lan/XE"
};

function assertPool(pool, test) {
    test.ok(pool, 'pool is defined');
    test.equal(typeof pool['_pool'], 'object', 'pool has a _pool object ' + Object.keys(pool));
}

describe('oraclepool', () => {
    describe('testDefaultPool', ()=> {
        it('exports a *oracledb* object to architect', (done) => {
            oraclepool({
                url: URI
            }, {}, function (err, res) {
                assert.ifError(err);
                assert.ok(res.oradb, 'exports a *oracledb* object to architect');
                assertPool(res.oradb, assert);
                done();
            });
        });
    });
    describe('testInvalidUrlPool', () => {
        it('should throw error on invalid url', (done) => {
            oraclepool({
                url: {
                    "user": "PREPROD3",
                    "password": "oracle",
                    "url": "ssssssssssssssssss/XE"
                }
            }, {}, function (err, res) {
                res.oradb._pool.getConnection(function (err) {
                    assert.ok(err, 'could not resolve the connect identifier specified');
                    done();
                });
            });
        });
    });
    describe('testMultiPool', () => {
        it('should handle multiple pool config', (done) => {
            oraclepool({
                first: {
                    url: URI
                },
                second: {
                    url: URI
                }
            }, {}, function (err, res) {
                assert.ifError(err);
                assert.ok(res.oradb, 'exports a *oracledb* object to architect');
                assertPool(res.oradb.first, assert);
                assertPool(res.oradb.second, assert);
                assert.ok(!res.oradb.connection, 'there is no *default* pool : *oracledb.connection* is not available');
                done();
            });
        });
    });
});
