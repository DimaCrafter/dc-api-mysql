const { DatabaseDriver, registerDriver } = require('dc-api-core/db');
const log = require('dc-api-core/log');
const mysql = require('mysql2/promise');

const { Model } = require('./model');

class MySQL extends DatabaseDriver {
	constructor (config) {
        super();
        this.config = config;
    }

	async connect () {
		this.pool = mysql.createPool({
			host: this.config.host,
			user: this.config.user,
			password: this.config.pass,
			database: this.config.name
		});

		this.pool.on('connection', connection => {
			connection.on('error', err => {
				log.error('MySQL connection error', err);
			});
		});
    }

	query (query) {
		return this.pool.query(query);
	}

	/**
	 * @param {string} name
	 * @param {any} schema
	 * @returns {Model}
	 */
	makeModel (name, schema) {
        return new Model(this, name, schema);
    }
}

module.exports = registerDriver(MySQL, 'mysql');
