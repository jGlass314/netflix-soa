require('newrelic');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const axios = require('axios');
// const indexRoutes = require('./routes/index');
const contentRoutes = require('./routes/content');
const homeRoutes = require('./routes/home').router;
const searchRoutes = require('./routes/search');

const app = new Koa();
const PORT = process.env.PORT || 3000;

app.use(bodyParser());
// app.use(indexRoutes.routes());
app.use(contentRoutes.routes());
app.use(homeRoutes.routes());
app.use(searchRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;