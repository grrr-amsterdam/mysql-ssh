#!/usr/bin/env node
/**
 * @author David Spreekmeester <david@grrr.nl>
 */

const mysql     = require('mysql2')
const fs        = require('fs')
const Client    = require('ssh2').Client;

var mysqlssh = module.exports = {

    /**
     * @param obj sshConfig SSH Configuration as defined by ssh2 package
     * @param obj dbConfig MySQL Configuration as defined by mysql(2) package
     * @return Promise <mysql2 connection>
     */
    connect: function(sshConfig, dbConfig) {
        dbConfig = mysqlssh._addDefaults(dbConfig)
        return new Promise(function(resolve, reject) {
            var ssh = new Client();
            ssh.on('ready', function() {
              ssh.forwardOut(
                '127.0.0.1',
                12345,
                dbConfig.host,
                dbConfig.port,
                function (err, stream) {
                  if (err) {
                      if (err.reason == 'CONNECT_FAILED') {
                          ssh.end()
                          reject('Connection failed.')
                      }

                      reject(err)
                  }

                  // override db host, since we're operating from within the SSH tunnel
                  dbConfig.host = 'localhost'
                  dbConfig.stream = stream

                  var sql = mysql.createConnection(dbConfig)
                  resolve(sql)
              });

            }).connect(sshConfig);
        })
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
