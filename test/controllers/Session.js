const { HttpController } = require('dc-api-core');

class Session extends HttpController {
	get () {
		return this.session;
	}

	async set () {
		this.session[this.query.key] = +this.query.value;
		await this.session.save();
		return 'Ok';
	}
}

module.exports = Session;
