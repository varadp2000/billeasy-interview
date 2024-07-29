const router = require('express').Router();
const client = require('../db');

router.post('/', (req, res) => {
	const {name, email} = req.body;
	client.query(`INSERT INTO users (name, email) VALUES ('${name}', '${email}')`, (err, result) => {
		if (err) {
			console.error('Error executing query', err);
			res.status(500).send('Error executing query');
			return;
		}
		client.query(`SELECT * FROM users WHERE email = '${email}'`, (err, result) => {
			if (err) {
				console.error('Error executing query', err);
				res.status(500).send('Error executing query');
				return;
			}
			res.send(result.rows[0]);
		})
	})
})

module.exports = router;