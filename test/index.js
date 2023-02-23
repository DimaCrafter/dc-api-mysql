const db = require('..').connect();

(async () => {
	await db.Product.init();

	// const test = await db.Product.create({
	// 	name: 'Test product',
	// 	price: 100,
	// 	parameters: '{"a":42}',
	// 	status: 'enabled'
	// });

	// const test1 = await db.Product.create({
	// 	name: 'Test product 2',
	// 	price: 200,
	// 	parameters: { a: 42 },
	// 	status: 'hidden'
	// });

	// console.log(test, test1);

	const product = await db.Product.findById(2).select('id', 'name', 'parameters');
	console.log(product);

	await db.Product.update({ price: { $lt: 150 } }, { price: Math.floor(90 + 90 * Math.random()) });
	await db.Product.updateById(Math.floor(Math.random() * 3 + 1), { parameters: { b: Date.now() } });
	await db.Product.deleteById(Math.floor(Math.random() * 3 + 1));

	const products = await db.Product.find({ status: 'enabled' }).select('id', 'name', 'price');
	console.log(products);

	process.exit();
})()
