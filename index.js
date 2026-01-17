const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Medicine = require('../models/medicine');

router.get('/', (req, res) => res.render('store'));

router.get('/signup', (req, res) => res.render('signup'));

router.post('/signup', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || username.length < 3)
    return res.send('Invalid username');
  if (!email || !email.includes('@'))
    return res.send('Invalid email');
  if (password.length < 6)
    return res.send('Password too short');
  if (password !== confirmPassword)
    return res.send('Passwords do not match');

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hashed });

  res.redirect('/login');
});

router.get('/login', (req, res) => res.render('login'));

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.send('Invalid credentials');

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send('Invalid credentials');

  req.session.userId = user._id;
  res.redirect('/medicines');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});
router.post('/add-medicine', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.redirect('/login');

  const count = await Medicine.countDocuments({ userId });
  if (count >= 5) return res.send('Only 5 medicines allowed');

  const { name, stock } = req.body;
  await Medicine.create({ userId, name, stock });

  res.redirect('/medicines');
});

router.get('/medicines', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.redirect('/login');

  const page = parseInt(req.query.page) || 1;
  const limit = 2;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const filter = {
    userId,
    name: { $regex: search, $options: 'i' }
  };

  const total = await Medicine.countDocuments(filter);
  const medicines = await Medicine.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.render('medicine-list', {
    medicines,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    search
  });
});

/* EDIT */
router.get('/edit/:id', async (req, res) => {
  const medicine = await Medicine.findOne({
    _id: req.params.id,
    userId: req.session.userId
  });
  res.render('edit-medicine', { medicine });
});

router.post('/edit/:id', async (req, res) => {
  const { name, stock } = req.body;
  await Medicine.updateOne(
    { _id: req.params.id, userId: req.session.userId },
    { name, stock }
  );
  res.redirect('/medicines');
});

/* DELETE */
router.get('/delete/:id', async (req, res) => {
  await Medicine.deleteOne({
    _id: req.params.id,
    userId: req.session.userId
  });
  res.redirect('/medicines');
});

module.exports = router;
