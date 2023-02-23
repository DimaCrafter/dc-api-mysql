const { DatabaseDriver, registerDriver } = require('dc-api-core/db');
const Log = require('dc-api-core/log');
const mysql = require('mysql2/promise');
const { Model } = require('./model');

function newTaskTracker () {
	let resolve, reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

class MySQL extends DatabaseDriver {
	constructor (config) {
        super();
        this.config = config;
		this.models = {};
    }

	async connect () {
		const tracker = newTaskTracker();
		this.connectionPromise = tracker.promise;

		this.connection = await mysql.createConnection({
			host: this.config.host,
			user: this.config.user,
			password: this.config.pass,
			database: this.config.name
		});

		console.log('pre-resolve', this.connection);
		tracker.resolve();
		this.connection.on('error', err => {
			Log.error('MySQL connection error', err);
			this.emit('disconnected');
		});
    }

	async query (query) {
		await this.connectionPromise;
		return this.connection.query(query);
	}

	/**
	 * @param {string} _basePath
	 * @param {string} name
	 * @param {any} schema
	 * @returns {Model}
	 */
	getModel (_basePath, name, schema) {
        if (name in this.models) {
            return this.models[name];
        }

        const model = new Model(this, name, schema);
        this.models[name] = model;
        return model;
    }
}

module.exports = registerDriver(MySQL, 'mysql');
