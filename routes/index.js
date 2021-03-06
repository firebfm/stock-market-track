/* eslint-disable camelcase */
/*
 * All routes for listings are defined here
 * Since this file is loaded in server.js into api/listings,
 *   these routes are mounted onto /listings
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const app = express();
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
      res.redirect('/portfolio');
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
    let shares = req.body.shares
    let url = `https://cloud-sse.iexapis.com/stable/stock/${req.body.symbol}/quote?token=` + process.env.API_KEY;

    fetch(url)
      .then(res => {
        if (res.ok) {
          console.log("SUCCESS")
          return res.json()
        } else {
          let found = false;
          console.log("Bad url, symbol not found")
          return Promise.reject('error 404')
        }
      })
      .then(data => {
        let stockPrice = data.latestPrice;
        let totalCost = stockPrice * shares;
        let symbol = data.symbol;

        console.log("Stock price is " + stockPrice)
        console.log("The total cost is " + totalCost)

        // get current balance, then subtract totalCost
        let queryString = `
        SELECT balance FROM users
        WHERE id = $1
        `;
        db.query(queryString, [req.session.user.id])
          .then((data) => {
            let balance = Number(data.rows[0].balance);
            balance = balance - totalCost;
            
            if (balance < 0) {
              res.status(500).send("NOT ENOUGH CASH");
            }

            // update balance
            queryString =`
            UPDATE users SET balance = $1
            WHERE id = $2
            RETURNING balance;
            `;
            db.query(queryString, [balance, req.session.user.id])
              .then(() => {
                // console.log("BALANCE IS " + JSON.stringify(balance.rows[0].balance))
              })
              .catch(err => {
                res.status(500).send({ error: err.message });
              })
          })
          .catch(err => {
            res.status(500).send({ error: err.message });
          })
        
        // insert into transactions
        queryString =`
        INSERT INTO transactions (symbol, shares, price, user_id)
        VALUES ($1, $2, $3, $4);
        `;
        db.query(queryString, [symbol, shares, stockPrice, req.session.user.id])
          .then(() => {
            res.redirect(200, '/portfolio');
          })
          .catch(err => {
            res.status(500).send({ error: err.message });
          })
        .catch(err => {
          res.status(500).send("ERROR 404, symbol not found");
        });

      })
      .catch(err => {
        res.status(500).send("ERROR 404, symbol not found");
      });
  })

  router.get("/portfolio", (req, res) => {
    if (req.session.user) {

      let balance = 0;
      let queryString = `
      SELECT balance FROM users
      WHERE id = $1
      `;
      db.query(queryString, [req.session.user.id])
        .then((dataB) => {
          return balance = dataB.rows[0].balance
        })

      db.query(`
      SELECT * FROM transactions
      WHERE user_id = $1;
      ;`, [req.session.user.id])
        .then(data => {
          const shares = data.rows.reduce((acc, { symbol, price, shares }) => {
            const existingShares = acc[symbol];
          
            if (!existingShares) acc[symbol] = 0;
          
            if (existingShares && price < 0) {
              acc[symbol] -= shares;
            } else if (price > 0) {
              acc[symbol] += shares;
            }
          
            return acc;
          
          }, {});
          
          // output = [{symbol: '' , shares: #}]
          const output = Object.keys(shares)
            .sort((shareA, shareB) => shareA > shareB ? 1 : -1)
            .map(symbol => {
              const total = shares[symbol];
          
            return { symbol, shares: total }
          })
          const templateVars = { user: req.session.user, arr: output, balance: balance};
          res.render("portfolio", templateVars);
        })
        .catch(err => {
          console.log("ERROR")
        });
    } else {
      res.redirect('/login');
    }
  });

  router.get("/sell", (req, res) => {
    if (req.session.user) {
      let templateVars = { user: req.session.user }
      res.render("sell", templateVars);
    } else {
      res.redirect('/login');
    }
  });

  router.post("/sell", (req, res) => {
    let shares = req.body.shares
    let url = `https://cloud-sse.iexapis.com/stable/stock/${req.body.symbol}/quote?token=` + process.env.API_KEY;

    fetch(url)
      .then(res => {
        if (res.ok) {
          console.log("SUCCESS")
          return res.json()
        } else {
          let found = false;
          console.log("Bad url, symbol not found")
          return Promise.reject('error 404')
        }
      })
      .then(data => {
        let stockPrice = data.latestPrice;
        let totalCost = stockPrice * shares;
        let symbol = data.symbol;

        console.log("Stock price is " + stockPrice)
        console.log("The total cost is " + totalCost)

        // get current balance, then add totalCost
        let queryString = `
        SELECT balance FROM users
        WHERE id = $1
        `;
        db.query(queryString, [req.session.user.id])
          .then((data) => {
            let balance = Number(data.rows[0].balance);
            balance = balance + totalCost;
            
            // update balance
            queryString =`
            UPDATE users SET balance = $1
            WHERE id = $2
            RETURNING balance;
            `;
            db.query(queryString, [balance, req.session.user.id])
              .then(() => {
                // console.log("BALANCE IS " + JSON.stringify(balance.rows[0].balance))
              })
              .catch(err => {
                res.status(500).send({ error: err.message });
              })
          })
          .catch(err => {
            res.status(500).send({ error: err.message });
          })
        
        // insert into transactions a negative stock price
        queryString =`
        INSERT INTO transactions (symbol, shares, price, user_id)
        VALUES ($1, $2, $3, $4);
        `;
        db.query(queryString, [symbol, shares, stockPrice*-1, req.session.user.id])
          .then(() => {
            res.redirect(200, '/portfolio');
          })
          .catch(err => {
            res.status(500).send({ error: err.message });
          })
        .catch(err => {
          res.status(500).send("ERROR 404, symbol not found");
        });

      })
      .catch(err => {
        res.status(500).send("ERROR 404, symbol not found");
      });
  })

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