const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Category = require('./models/category');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL);

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, async () => {
      const user = await User.findById(req.user.id);
      if (user.role !== 'admin') {
        throw new Error();
      }
      next();
    });
  } catch (error) {
    res.status(403).send({ error: 'Admin access required.' });
  }
};

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ active: true });
    res.send(categories);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get('/api/categories/:categoryId', async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).send();
    }
    res.send(category);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post('/api/categories', adminAuth, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).send(category);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.put('/api/categories/:categoryId', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.categoryId,
      req.body,
      { new: true }
    );
    if (!category) {
      return res.status(404).send();
    }
    res.send(category);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.delete('/api/categories/:categoryId', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.categoryId,
      { active: false },
      { new: true }
    );
    if (!category) {
      return res.status(404).send();
    }
    res.send({ message: 'Category deleted' });
  } catch (error) {
    res.status(400).send(error);
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Categories service running on port ${PORT}`));