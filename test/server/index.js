const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const router = new Router();

const contentRoutes = require('./content');
const clientRoutes = require('./client');

const app = new Koa();
const PORT = process.env.PORT || 1337;

app.use(bodyParser());
app.use(contentRoutes.routes());
app.use(clientRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`****Test**** Server listening on port: ${PORT}`);
});

module.exports = server;