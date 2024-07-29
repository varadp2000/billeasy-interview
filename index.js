const express = require('express');

const app = express();
require('dotenv').config()

const userRouter = require('./api/user');
const ticketRouter =  require('./api/ticket');

app.use(express.json());
app.use('/api/user', userRouter);
app.use('/api/ticket', ticketRouter);

app.get('/', (req, res) => {
	res.send("Backend Working")
})

app.listen(process.env.PORT, () => {
	console.log("Server is running on port 3000")
})