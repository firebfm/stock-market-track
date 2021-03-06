/* eslint-disable camelcase */
/*
 * All routes for listings are defined here
 * Since this file is loaded in server.js into api/listings,
 *   these routes are mounted onto /listings
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const app = express();
const ENV = process.env.ENV || "development";
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const router = express.Router();
const moment = require('moment');
moment().format();
const fetch = require("node-fetch");

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

module.exports = (db) => {
  router.get("/", (req, res) => {
    if (req.session.user) {
      res.redirect('/index');
    } else {
      res.redirect('/login');
    }
  })

  router.get("/quote", (req, res) => {
    let templateVars = { user: req.session.user, stock: null }
    res.render("quote", templateVars);
  });

  router.post("/quote", (req, res) => {
    let url = `https://cloud-sse.iexapis.com/stable/stock/${req.body.symbol}/quote?token=` + process.env.API_KEY;

    fetch(url)
      .then(res => {
        if (res.ok) {
          console.log("SUCCESS")
          return res.json()
        } else {
          console.log("Bad url, symbol not found")
        }
      })
      .then(data => {
        // json data is stored
        let templateVars = { user: req.session.user, stock: data };
        res.render("quote", templateVars);
      })
      .catch(err => {
        res.status(500).send(err.message);
      });
  });

  router.get("/buy", (req, res) => {
    if (req.session.user) {
      let templateVars = { user: req.session.user }
      res.render("buy", templateVars);
    } else {
      res.redirect('/login');
    }
  });

  router.post("/buy", (req, res) => {
    let url = `https://cloud-sse.iexapis.com/stable/stock/${req.body.symbol}/quote?token=` + process.env.API_KEY;
    let shares = req.body.shares

    fetch(url)
      .then(res => {
        if (res.ok) {
          console.log("SUCCESS")
          return res.json()
        } else {
          let found = false;
          console.log("Bad url, symbol not found")
        }
      })
      .then(data => {
        let stockPrice = data.latestPrice
        let totalCost = stockPrice * shares
        console.log("Stock Price is " + stockPrice)
        console.log("The total cost is " + totalCost)
      })
      .catch(err => {
        res.status(500).send(err.message);
      });
  })

  router.get("/portfolio", (req, res) => {
    const templateVars = { user: req.session.user };
    if (req.session.user) {
      res.render("portfolio", templateVars);
    } else {
      res.redirect('/login');
    }
  });

  router.get("/login", (req, res) => {
    const templateVars = { user: req.session.user };
    res.render("login", templateVars);
  });

  router.post("/logout", (req, res) => {
    req.session = null;
    res.redirect('/');
  });

  router.post("/login", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    db.query(`
    SELECT * FROM users
    WHERE username = $1;
    ;`, [username])
      .then(data => {
        if (data.rows[0].password === password) { 
          req.session.user = data.rows[0];
          res.redirect("/portfolio");
        } else {
          res.status(403).send('Wrong password');
        }
      })
      .catch(err => {
        res.status(500).redirect('error', err.message);
      });
  })
  return router;
}