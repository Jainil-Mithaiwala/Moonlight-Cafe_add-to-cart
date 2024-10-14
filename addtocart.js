const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type']
}));

const db = mysql.createPool({
  connectionLimit: 10,
  host: 'brpas2iea9jom89b3qnr-mysql.services.clever-cloud.com',
  user: 'uu19tu8hjb0q1yhz',
  password: 'p1zXV4UJrwNSnVVVOtjW',
  database: 'brpas2iea9jom89b3qnr'
});

// Fetch categories
app.get('/view-menu/categories', (req, res) => {
  const query = 'SELECT * FROM categories';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.status(200).json(results);
  });
});

// Fetch food items
app.get('/view-menu/fooditems', (req, res) => {
  const query = 'SELECT * FROM food_items';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching food items:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.status(200).json(results);
  });
});

// Add to cart endpoint
app.post('/add-to-cart', (req, res) => {
  const { name, email, table, food_id, price, created_at, quantity } = req.body;

  if (!name || !email || !table || !food_id || !price || !created_at || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const convertToMySQLDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  const formattedCreatedAt = convertToMySQLDate(created_at);

  const query = `
    INSERT INTO temp_carts (name, price, client_email, created_at, updated_at, food_id, \`table\`, quantity)
    VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
  `;

  const values = [name, price, email, formattedCreatedAt, food_id, table, quantity];

  db.query(query, values, (err) => {
    if (err) {
      console.error('Error inserting into temp_carts:', err);
      return res.status(500).json({ error: 'Database query failed', details: err.message });
    }
    res.status(201).json({ message: 'Item added to cart successfully' });
  });
});

// Get cart items by table number
app.get('/view-cart/:tableNo', (req, res) => {
  const { tableNo } = req.params;

  const query = `
    SELECT 
      tc.food_id,
      tc.quantity,
      tc.client_email,
      tc.created_at,
      tc.updated_at,
      msc.image_url,
      msc.name,
      msc.price
    FROM 
      temp_carts AS tc
    JOIN 
      menu_sub_categories AS msc ON tc.food_id = msc.id
    WHERE 
      tc.\`table\` = ?
  `;

  db.query(query, [tableNo], (err, results) => {
    if (err) {
      console.error('Error fetching cart items:', err);
      return res.status(500).json({ error: 'Database query failed', details: err.message });
    }
    res.status(200).json(results);
  });
});

// Get cart items by table number
app.get('/view-cart/:tableNo', (req, res) => {
  const { tableNo } = req.params;
  const query = `
    SELECT name, price, client_email, created_at, updated_at, food_id, \`table\`, quantity
    FROM temp_carts 
    WHERE \`table\` = ?
  `;

  db.query(query, [tableNo], (err, results) => {
    if (err) {
      console.error('Error fetching cart items:', err);
      return res.status(500).json({ error: 'Database query failed', details: err.message });
    }
    res.status(200).json(results);
  });
});

// Remove item from cart
app.delete('/remove-from-cart/:food_id', (req, res) => {
  const { food_id } = req.params;

  const query = 'DELETE FROM temp_carts WHERE food_id = ?';

  db.query(query, [food_id], (err) => {
    if (err) {
      console.error('Error removing item from temp_carts:', err);
      return res.status(500).json({ error: 'Database query failed', details: err.message });
    }
    res.status(200).json({ message: 'Item removed from cart successfully' });
  });
});

// Update item quantity in cart
app.put('/update-quantity/:food_id', (req, res) => {
  const { food_id } = req.params;
  const { quantity } = req.body;

  const query = 'UPDATE temp_carts SET quantity = ? WHERE food_id = ?';
  db.query(query, [quantity, food_id], (err) => {
    if (err) {
      console.error('Error updating quantity:', err);
      return res.status(500).json({ error: 'Database query failed', details: err.message });
    }
    res.status(200).json({ message: 'Quantity updated successfully' });
  });
});

// Start server
const PORT = 2007;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
