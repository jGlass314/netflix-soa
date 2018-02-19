require('newrelic');
const Koa = require('koa');
const app = new Koa();
const bodyParser = require('koa-bodyparser');

const contentRoutes = require('./routes/content');
const homeRoutes = require('./routes/home').router;
const searchRoutes = require('./routes/search').router;
const playerRoutes = require('./routes/player');
const userRoutes = require('./routes/user');

require('dotenv').config()

const PORT = process.env.PORT;

app.use(bodyParser());
app.use(contentRoutes.routes());
app.use(homeRoutes.routes());
app.use(searchRoutes.routes());
app.use(playerRoutes.routes());
app.use(userRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
  console.log(`Content server access: ${process.env.CONTENTADDRESS}`);
  console.log(`Player server access: ${process.env.PLAYERADDRESS}`);
  console.log(`User & Licensing server access: ${process.env.USERADDRESS}`);
});

module.exports = server;