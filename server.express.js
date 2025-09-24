// server.express.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// ---- middleware-----
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'dev-secret'));
app.use('/results.html', requireUser); //to make sure user is loged in first befopre opening results pg
app.use(express.static(path.join(__dirname, 'public')));

// ---- db -----
let db, Users, Entries;

async function start() { // Conects first and then start server
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    Users = db.collection('users');
    Entries = db.collection('entries');
    console.log('MongoDB connected');

    //start();
    app.listen(port, () => {
       console.log(`Express server on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Mongo connect error:', err);
    process.exit(1);
  }
}

start();


function withDerived(row) { // age from "year" field (if age in future can go negativee)
  const currentYear = new Date().getFullYear();
  return { ...row, age: currentYear - Number(row.year) };
}


//------- Authenticatr  guard ------
function requireUser(req, res, next) {
  const username = req.signedCookies.user;
  if (!username) return res.redirect('/login.html');
  req.user = username;
  next();
}

// ------- Authenticator Routes------------
app.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const existing = await Users.findOne({ username });
  if (!existing) {
    await Users.insertOne({ username, password });
    res.cookie('user', username, { signed: true, httpOnly: true });
    return res.status(201).json({ username });
  }
  if (existing.password !== password) return res.status(401).json({ error: 'invalid password' });

  res.cookie('user', username, { signed: true, httpOnly: true });
  res.json({ username });
});

app.post('/logout', (req, res) => {
  res.clearCookie('user');
  res.json({ ok: true });
});

// ---- pages ----------------
app.get('/', (req, res) => {
  if (req.signedCookies.user) return res.redirect('/app'); //Checks Signed in user already
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

//Routs to page once user signed in
app.get('/app', requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// protect results page too. So unauthenticated users redirected before page loads
app.get('/results.html', requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// ---- API (user-scoped ) --------------
//chekc data of already signed in user
app.get('/api/entries', requireUser, async (req, res) => { 
  const rows = await Entries.find({ user: req.user }).toArray();
  res.json(rows.map(withDerived));
});

app.post('/api/entries', requireUser, async (req, res) => {
  const { model, year, mpg } = req.body || {};
  if (!model || !Number.isFinite(+year) || !Number.isFinite(+mpg)) {
    return res.status(400).json({ error: 'Expected { model, year, mpg }' });
  }
  const doc = { user: req.user, model: String(model), year: +year, mpg: +mpg };
  const { insertedId } = await Entries.insertOne(doc);
  res.status(201).json(withDerived({ _id: insertedId, ...doc }));
});

app.put('/api/entries/:id', requireUser, async (req, res) => {
  const { id } = req.params;
  const { model, year, mpg } = req.body || {};
  const filter = { _id: new ObjectId(id), user: req.user };
  const update = { $set: {} };
  if (model != null) update.$set.model = String(model);
  if (year  != null) update.$set.year  = +year;
  if (mpg   != null) update.$set.mpg   = +mpg;

  const r = await Entries.findOneAndUpdate(filter, update, { returnDocument: 'after' });
  if (!r.value) return res.status(404).json({ error: 'not found' });
  res.json(withDerived(r.value));
});

app.delete('/api/entries/:id', requireUser, async (req, res) => {
  const { id } = req.params;
  const r = await Entries.findOneAndDelete({ _id: new ObjectId(id), user: req.user });
  if (!r.value) return res.status(404).json({ error: 'not found' });
  res.json(withDerived(r.value));
});

//start();
// app.listen(port, () => {
//   console.log(`Express server on http://localhost:${port}`);
// });
