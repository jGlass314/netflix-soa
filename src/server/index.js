const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

const indexRoutes = require('./routes/index');
const contentRoutes = require('./routes/content');

const app = new Koa();
const PORT = process.env.PORT || 3000;

app.use(bodyParser());
app.use(indexRoutes.routes());
app.use(contentRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;