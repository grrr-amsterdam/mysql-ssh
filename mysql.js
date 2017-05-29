#!/usr/bin/env node
/**
 * @author David Spreekmeester <david@grrr.nl>
 */

const mysql     = require('mysql2')
const fs        = require('fs')
const Client    = require('ssh2').Client;

var tunnel = module.exports = {

    _conn: null,

    /**
     * @param obj sshConfig SSH Configuration as defined by ssh2 package
     * @param obj dbConfig MySQL Configuration as defined by mysql(2) package
     * @return Promise <mysql2 connection>
     */
    connect: function(sshConfig, dbConfig) {
        dbConfig = tunnel._addDefaults(dbConfig)
        return new Promise(function(resolve, reject) {
            tunnel._conn = new Client();
            tunnel._conn.on('ready', tunnel._onReady).connect(sshConfig)
        })
    },

    close: function() {
        tunnel._conn.end()
    },

    _onReady: function() {
        tunnel._conn.forwardOut(
            '127.0.0.1',
            12345,
            dbConfig.host,
            dbConfig.port,
            function (err, stream) {
                if (err) {
                    tunnel._conn.end()
                    var msg = err.reason == 'CONNECT_FAILED'
                        ? 'Connection failed.'
                        : err
                    return reject(err)
                }

                // override db host, since we're operating from within the SSH tunnel
                dbConfig.host = 'localhost'
                dbConfig.stream = stream

                var sql = mysql.createConnection(dbConfig)
                resolve(sql)
            }
        )
    },

    _addDefaults(dbConfig) {
        if (!('port' in dbConfig)) {
            dbConfig.port = 3306
        }

        if (!('host' in dbConfig)) {
            dbConfig.host = 'localhost'
        }

        return dbConfig
    }
}
