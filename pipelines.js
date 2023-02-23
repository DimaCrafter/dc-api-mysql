const { SqlQuery } = require('./query');

class Pipeline {
	/**
	 * @param {import('./model').Model} model
	 */
	constructor (model) {
		this._model = model;
	}

	/** @type {SqlQuery} */
	_query;

	then (resolve) {
		resolve(this.execute());
	}

	async execute () {
		return this._query.execute(this._model.db);
	}
}

class FindPipeline extends Pipeline {
	constructor (model, where) {
		super(model);
		this._table = model.collectionName;
		this._query = new SqlQuery().where(where);
	}

	select (...fields) {
		this._projection = fields;
		return this;
	}

	async execute () {
		this._query.select(this._table, this._projection);

		const result = await this._query.takeAll(this._model.db);
		for (const item of result) {
			this._model._deserialize(item);
		}

		return result;
	}
}

class FindOnePipeline extends FindPipeline {
	constructor (model, where) {
		super(model, where);
		this._query.limit(1);
	}

	async execute () {
		this._query.select(this._table, this._projection);

		const result = await this._query.takeOne(this._model.db);
		this._model._deserialize(result);

		return result;
	}
}

class DeletePipeline extends Pipeline {
	constructor (model, where) {
		super(model);
		this._query = SqlQuery.delete(model.collectionName).where(where);
	}
}

class DeleteOnePipeline extends DeletePipeline {
	constructor (model, where) {
		super(model, where);
		this._query.limit(1);
	}
}

class UpdatePipeline extends Pipeline {
	constructor (model, where, values) {
		super(model);
		this._model._serialize(values);
		this._query = SqlQuery.update(model.collectionName, values).where(where);
	}
}

class UpdateOnePipeline extends UpdatePipeline {
	constructor (model, where, values) {
		super(model, where, values);
		this._query.limit(1);
	}
}

module.exports = {
	FindPipeline, FindOnePipeline,
	DeletePipeline, DeleteOnePipeline,
	UpdatePipeline, UpdateOnePipeline
};
