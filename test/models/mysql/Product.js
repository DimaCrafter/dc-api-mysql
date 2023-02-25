const { string, int, json, enumerable } = require('dc-api-core/db');

module.exports = {
	name: string(32).required,
	price: int().required,
	parameters: json(),
	status: enumerable('enabled', 'hidden', 'disabled').default('enabled')
};
