const { escapeId, escape } = require('mysql2');
const { SqlQuery } = require('./query');
const { pascalToSnake, schemaTypeToSql } = require('./utils');
const {
	FindPipeline, FindOnePipeline,
	DeletePipeline, DeleteOnePipeline,
	UpdatePipeline, UpdateOnePipeline
} = require('./pipelines');

class Model {
	/**
	 * @param {InstanceType<import('.')>} db
	 * @param {string} name Model file name
	 * @param {any} schema
	 */
	constructor (db, name, schema) {
		this.db = db;
		this.name = name;
		if (name.endsWith('s') || name.endsWith('S')) {
			this.collectionName = pascalToSnake(name + 'es');
		} else {
			this.collectionName = pascalToSnake(name + 's');
		}

		if (!schema.id) {
			schema = Object.assign({ id: { type: 'int', primary: true, increment: true } }, schema);
		}

		this.schema = schema;
	}

	async tableExists () {
		return Boolean(
			await SqlQuery
				.select('information_schema.tables', 'COUNT(*)')
				.where({ table_schema: this.db.config.name, table_name: this.collectionName })
				.limit(1)
				.takeValue(this.db)
		);
	}

	/**
	 * Initialize table
	 * @returns `true` if table was created, `false` if already exists
	 */
	async init () {
		if (await this.tableExists()) return false;

		await SqlQuery.createTable(this.collectionName, this.schema).execute(this.db);
		return true;
	}

	async create (values) {
		this._serialize(values);

		const [result] = await SqlQuery.insert(this.collectionName, values).execute(this.db);
		values.id = result.insertId;

		this._deserialize(values);
		return values;
	}

	find (where) {
		return new FindPipeline(this, where);
	}

	findOne (where) {
		return new FindOnePipeline(this, where);
	}

	findById (id) {
		return new FindOnePipeline(this, { id });
	}

	delete (where) {
		return new DeletePipeline(this, where);
	}

	deleteOne (where) {
		return new DeleteOnePipeline(this, where);
	}

	deleteById (id) {
		return new DeleteOnePipeline(this, { id });
	}

	update (where, values) {
		return new UpdatePipeline(this, where, values);
	}

	updateOne (where, values) {
		return new UpdateOnePipeline(this, where, values);
	}

	updateById (id, values) {
		return new UpdateOnePipeline(this, { id }, values);
	}

	_serialize (values) {
		for (const field in values) {
			const info = this.schema[field];
			if (!info) continue;

			if (info.json) {
				if (typeof values[field] != 'string') {
					values[field] = JSON.stringify(values[field]);
				}
			}
		}
	}

	_deserialize (values) {
		for (const field in values) {
			const info = this.schema[field];
			if (!info) continue;

			if (info.json) {
				values[field] = JSON.parse(values[field]);
			}
		}
	}
}

module.exports = { Model };
