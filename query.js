const { escapeId, escape } = require('mysql2');
const { schemaTypeToSql } = require('./utils');

class SqlQuery {
	static OPERATIONS = {
		$lt: (value, result) => result.push('<', escape(value)),
		$lte: (value, result) => result.push('<=', escape(value)),
		$gt: (value, result) => result.push('>', escape(value)),
		$gte: (value, result) => result.push('>=', escape(value)),
		$ne: (value, result) => result.push('<>', escape(value))
	};

	raw = '';
	constructor (raw) {
		if (raw) this.raw = raw;
	}

	static createTable (tableName, schema) {
		const lines = [];
		for (const field in schema) {
			const info = schema[field];
			let line = escapeId(field);
			line += ' ';
			line += schemaTypeToSql(info.type);

			if (info.type == 'enum') {
				line += '(';
				line += info.values.map(escape).join(',');
				line += ')';
			} else if (info.length) {
				line += '(';
				line += info.length;
				line += ')';
			}

			const nullable = !info.required && !info.default;
			if (info.increment) {
				line += ' NOT NULL AUTO_INCREMENT';
			} else {
				line += nullable ? ' NULL' : ' NOT NULL';

				if (info.default) {
					line += ' DEFAULT ';
					line += escape(info.default);
				} else {
					if (nullable) line += ' DEFAULT NULL';
				}
			}

			lines.push(line);

			if (info.primary) {
				lines.push(`PRIMARY KEY(${escapeId(field)})`);
			} else if (info.key) {
				line = 'FOREIGN KEY (';
				line += escapeId(field);
				line += ') REFERENCES ';
				line += escapeId(info.key['table']);
				line += '(';
				line += escapeId(info.key['field']);
				line += ') ON DELETE ';
				line += info.key['delete'] || 'NO ACTION';
				line += ' ON UPDATE ';
				line += info.key['update'] || 'NO ACTION';
				lines.push(line);
			}
		}

		return new SqlQuery(`CREATE TABLE ${escapeId(tableName)} (${lines.join(',')})`);
	}

	static insert (table, fields) {
		let raw = 'INSERT INTO ';
		raw += escapeId(table);
		raw += ' (';
		raw += Object.keys(fields).map(escapeId).join(',');
		raw += ') VALUES (';
		raw += Object.values(fields).map(escape).join(',');
		raw += ')';

		return new SqlQuery(raw);
	}

	static delete (table) {
		return new SqlQuery('DELETE FROM ' + escapeId(table));
	}

	static update (table, values) {
		let dataset = [];
		for (const key in values) {
			dataset.push(escapeId(key) + '=' + escape(values[key]));
		}

		return new SqlQuery('UPDATE ' + escapeId(table) + ' SET ' + dataset.join(','));
	}

	static select (table, projection) {
		return new SqlQuery().select(table, projection);
	}

	select (table, projection) {
		if (!projection) {
			projection = '*';
		} else if (typeof projection != 'string') {
			projection = SqlQuery.prepareProjection(projection);
		}

		return this.selectRaw(escapeId(table), projection);
	}

	selectRaw (tableName, projection) {
		this.raw = `SELECT ${projection} FROM ${tableName}${this.raw}`;
		return this;
	}

	baseJoin (localTableName, localField, foreignTableName, foreignField) {
		this.raw += foreignTableName;
		this.raw += ' ON ';
		this.raw += localTableName;
		this.raw += '.';
		this.raw += escapeId(localField);
		this.raw += '=';
		this.raw += foreignTableName;
		this.raw += '.';
		this.raw += escapeId(foreignField);
	}

	innerJoin (localTableName, localField, foreignTableName, foreignField) {
		this.raw += ' INNER JOIN ';
		this.baseJoin(localTableName, localField, foreignTableName, foreignField);

		return this;
	}

	leftJoin (localTableName, localField, foreignTableName, foreignField) {
		this.raw += ' LEFT JOIN ';
		this.baseJoin(localTableName, localField, foreignTableName, foreignField);

		return this;
	}

	where (where, table = '') {
		if (table) {
			table = escapeId(table) + '.';
		}

		if (where) {
			let parts = [];
			SqlQuery._where(where, table, parts);

			this.raw += ' WHERE ';
			this.raw += parts.join(' ');
		}

		return this;
	}

	static _where (where, table, parts) {
		let prevLogical = true;
		for (const field in where) {
			if (prevLogical) {
				prevLogical = false;
			} else {
				parts.push('AND');
			}

			const value = where[field];
			if (field[0] == '$') {
				const op = this.OPERATIONS[field];
				if (!op) throw new Error(`Query operation "${field}" not supported`);
				op(value, parts);
			} else {
				parts.push(table + escapeId(field));
				if (typeof value == 'object') {
					this._where(value, table, parts);
				} else {
					parts.push('=' + escape(value));
				}
			}
		}
	}

	sort (by, descending = false) {
		this.raw += ` ORDER BY ${by} `;
		if (descending) this.raw += 'DESC';
		else this.raw += 'ASC';

		return this;
	}

	limit (count, skip = 0) {
		if (skip) this.raw += ` LIMIT ${skip}, ${count}`;
		else this.raw += ` LIMIT ${count}`;

		return this;
	}

	as (name) {
		this.raw = `(${this.raw}) AS ${escapeId(name)}`;
		return this;
	}

	/** @param {InstanceType<import('.')>} db */
	async execute (db) {
		return db.query(this.raw);
	}
	/** @param {InstanceType<import('.')>} db */
	async takeValue (db) {
		const [[result], [col]] = await db.query(this.raw);
		return result[col.name];
	}
	/** @param {InstanceType<import('.')>} db */
	async takeOne (db) {
		const [[result]] = await db.query(this.raw);
		return result;
	}
	/** @param {InstanceType<import('.')>} db */
	async takeAll (db) {
 		const [result] = await db.query(this.raw);
		return result;
	}


	static prepareProjection (projection, table = '') {
		if (table) {
			table = escapeId(table) + '.';
		}

		return projection.map(field => {
			if (field instanceof SqlQuery) return field.raw;
			else if (field[field.length - 1] == '*') return field;
			else return table + escapeId(field);
		}).join(',');
	}

	static prepareValue (value) {
		if (value === null) return 'NULL';
		else if (value instanceof SqlQuery) return '(' + value.raw + ')';
		else if (typeof value == 'string') return escape(value);
		else return value;
	}
}

module.exports = { SqlQuery };
