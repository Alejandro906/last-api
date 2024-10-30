const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Product = require('./models/product');

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

app.get('/api/products', async (req, res) => {
  try {
    const { category, animalType, page = 1, limit = 10 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (animalType) query.animalType = animalType;

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.send(products);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get('/api/products/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send();
    }
    res.send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post('/api/products', adminAuth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.put('/api/products/:productId', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!product) {
      return res.status(404).send();
    }
    res.send(product);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.delete('/api/products/:productId', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) {
      return res.status(404).send();
    }
    res.send({ message: 'Product deleted' });
  } catch (error) {
    res.status(400).send(error);
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Products service running on port ${PORT}`));