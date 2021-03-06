# Stock Market Tracket - Work in Progress

Stock Market Track gets the stock details from IEX Cloud. It allows one to download stock info via their API with URLs such as https://cloud-sse.iexapis.com/stable/stock/znga/quote?token=API_KEY. Featuring user login using session. Portfolio tab keeps track of your portfolio (the number of shares you own for each symbol) and displays cash balance. Buy and sell tab will let you transact stocks and updates your balance. Work in progress: error checking balance for buy, error checking shares owned for sell, refactoring route code and db queries into functions.

## Setup

Install dependencies with `npm install`.
How to obtain your api key? Visit iexcloud.io/cloud-login#/register/.
Select the “Individual” account type, then enter your email address and a password, and click “Create account”.
Once registered, scroll down to “Get started for free” and click “Select Start” to choose the free plan.
Once you’ve confirmed your account via a confirmation email, visit https://iexcloud.io/console/tokens.
Copy the key that appears under the Token column (it should begin with pk_).
Create a .env file (follow the format of .env.example)
Add your API_KEY into the .env file
Create a database in psql called stock_market_track.
Type npm run db:reset to create tables and insert seed data.

## User login
Check the database for username and password. Here they are:
admin admin123
deku deku123
ninja ninja123

## Technology Used
Postgresql
Node.js
Express
EJS template language

## Running Webpack Development Server

```sh
npm start
```
visit http://localhost:8080/ in your browser

## Screenshots of work in progress

!["Screenshot of quote"](https://raw.githubusercontent.com/firebfm/stock-market-track/master/docs/quote.jpg)
!["Screenshot of portfolio"](https://raw.githubusercontent.com/firebfm/stock-market-track/master/docs/portfolio.jpg)