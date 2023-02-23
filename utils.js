exports.pascalToSnake = value => {
	let isLastUpper = false;
	let result = '';

	for (const char of value) {
		if (char.toUpperCase() == char) {
			if (isLastUpper) result += char.toLowerCase();
			else result += '_' + char.toLowerCase();
			isLastUpper = true;
		} else {
			result += char;
			isLastUpper = false;
		}
	}

	return result.slice(1);
}

/** @param {import('dc-api-core/db').ModelFieldInfo['type']} type */
exports.schemaTypeToSql = type => {
	switch (type) {
		case 'string': return 'varchar';
		default: return type;
	}
}
