const express = require('express');
const router = express.Router();
const Medicine = require('../model/medicine');

function isLogin(req, res, next){
    if(!req.session.user) return res.redirect('/login');
    next();
}

// Add medicine form
router.get('/add', isLogin, (req, res) => {
    res.render('add-medicine');
});

// Add medicine POST
router.post('/add', isLogin, async (req, res) => {
    const count = await Medicine.countDocuments({ userId: req.session.user._id });
    if(count >= 5) return res.send('You can only add 5 medicines');

    await Medicine.create({
        name: req.body.name,
        stock: req.body.stock,
        userId: req.session.user._id
    });

    res.redirect('/medicine/list');
});

// List medicines
router.get('/list', isLogin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const search = req.query.search || '';

    const medicines = await Medicine.find({
        userId: req.session.user._id,
        name: { $regex: search, $options: 'i' }
    }).skip((page-1)*limit).limit(limit);

    res.render('medicine-list', { medicines, page, search, limit });
});

// Edit medicine form
router.get('/edit/:id', isLogin, async (req, res) => {
    const med = await Medicine.findById(req.params.id);
    res.render('edit-medicine', { med });
});

// Edit medicine POST
router.post('/edit/:id', isLogin, async (req, res) => {
    await Medicine.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        stock: req.body.stock
    });
    res.redirect('/medicine/list');
});

// Delete medicine
router.get('/delete/:id', isLogin, async (req, res) => {
    await Medicine.findByIdAndDelete(req.params.id);
    res.redirect('/medicine/list');
});

module.exports = router;
