const { string, int, text, enumerable } = require('dc-api-core/db');

module.exports = {
	name: string(32).required,
	price: int().required,
	parameters: text().json,
	status: enumerable('enabled', 'hidden', 'disabled').default('enabled')
};
