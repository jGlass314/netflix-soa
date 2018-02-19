const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const router = new Router();
require('dotenv').config()
const contentRoutes = require('./content');
const clientRoutes = require('./client');
const userRoutes = require('./user');
const playerRoutes = require('./player');

const app = new Koa();
const PORT = process.env.PORT;

app.use(bodyParser());
app.use(contentRoutes.routes());
app.use(clientRoutes.routes());
app.use(userRoutes.routes());
app.use(playerRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`****Test**** Server listening on port: ${PORT}`);
  console.log(`Client Facing Service access: ${process.env.CFSADDRESS}`);
});

module.exports = server;