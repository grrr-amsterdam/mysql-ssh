#!/usr/bin/env node
/**
 * @author David Spreekmeester <david@grrr.nl>
 */

const mysql     = require('mysql2')
const fs        = require('fs')
const Client    = require('ssh2').Client;

var tunnel = module.exports = {

    /**
     * @var ssh2.Connection _conn The SSH connection
     */
    _conn: null,

    /**
     * @var mysql2.Connection _conn The MySQL connection
     */
    _sql: null,

    /**
     * @param obj sshConfig SSH Configuration as defined by ssh2 package
     * @param obj dbConfig MySQL Configuration as defined by mysql(2) package
     * @return Promise <mysql2 connection>
     */
    connect: function(sshConfig, dbConfig) {
        dbConfig = tunnel._addDefaults(dbConfig)
        return new Promise(function(resolve, reject) {
            tunnel._conn = new Client();
            tunnel._conn.on('ready', function() {
                tunnel._conn.forwardOut(
                    '127.0.0.1',
                    12345,
                    dbConfig.host,
                    dbConfig.port,
                    function (err, stream) {
                        if (err) {
                            tunnel.close()
                            var msg = err.reason == 'CONNECT_FAILED'
                                ? 'Connection failed.'
                                : err
                            return reject(msg)
                        }

                        // override db host, since we're operating from within the SSH tunnel
                        dbConfig.host = 'localhost'
                        dbConfig.stream = stream

                        tunnel._sql = mysql.createConnection(dbConfig)
                        resolve(tunnel._sql)
                    }
                )
            }).connect(sshConfig)
        })
    },

    close: function() {
        if ('end' in tunnel._sql) {
            tunnel._sql.end(function(err) {})
        }

        if ('end' in tunnel._conn) {
            tunnel._conn.end()
        }
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
