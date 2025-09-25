A3 Two-tier Web App --- Andreas Keating Onyos

Render: https://render.com/docs/troubleshooting-deploys
Repo: https://github.com/AndreasKeating/a3-AndreasKeating-a25

What it does

Express server serves the app and a JSON API, with simple cookie-based login.

MongoDB (Atlas) stores users and entries so data persists across restarts.

User-scoped data: after signing in, you can add / update / delete your own car entries.

Derived field: server computes age = currentYear - year for each row.

Results page: shows all of your rows (model, year, mpg, age).

CSS framework: uses [Pico.css] for layout/typography so it looks clean with minimal custom CSS.

Pages & routes

GET / → login page (or redirects to /app if already signed in)

POST /login → creates account on first login, or validates password

POST /logout → clears session cookie

GET /app → main app page (Add / Update / Delete forms)

GET /results.html → results table (protected; only when logged in)

API (all routes require login)

GET /api/entries → list current user’s entries (with age added)

POST /api/entries → add { model, year, mpg }

PUT /api/entries/:id → update any subset of { model, year, mpg }

DELETE /api/entries/:id → delete by id

How to run locally

Install deps

npm install


Create .env (not committed to git)

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority&appName=<app>
COOKIE_SECRET=some-long-random-string
PORT=3000


Start

npm start


Open http://localhost:3000/
 and sign in with any username/password — first login creates the account.


Notess:
New users are created automatically on first successful login (as allowed in the spec).
Passwords are stored as plain text for simplicity in A3 (no hashing required for the baseline).
All UI pages are protected (results requires login; / redirects signed users to /app).

Lighthouse / Accessibility:
Lighthouse (desktop): achieved 100/100/100/100 locally (Performance, Best Practices, Accessibility, SEO).
Scores may vary slightly on Render due to network.

Accessibility touches:
Skip link to main content, visible focus styles (:focus-visible)
Form labels and helpful descriptions (aria-live on status messages, table caption, proper <th scope>)

Extra UX polish (small “achievements”):
Results tools: live filter box; click column headers to sort; click an ID to copy; Download JSON/CSV buttons.
(If your course only counts the official “Achievements” bucket, list the ones you want to claim here, or remove this section.)

Tech used:
Express 5, mongodb driver, cookie-parser, dotenv
Pico.css via CDN
Vanilla front-end JS (fetch, FormData)

File map:
public/
  login.html      # login page (creates account on first sign-in)
  index.html      # Add / Update / Delete forms
  results.html    # protected results table with filter/sort/download
server.express.js # Express app + MongoDB + routes
.env               # your secrets (not in git)
package.json

Deployment (Render)

Add your .env values to Render Environment Variables (don’t commit them).

Start command: node server.express.js