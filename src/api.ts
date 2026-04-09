import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors())

// -----------------------------
// Type Definitions
// -----------------------------
interface User {
  id?: number;
  name: string;
  email: string;
}

interface Product {
  id?: number;
  name: string;
  price: number;
}

let db: Database;

// -----------------------------
// Database Initialization
// -----------------------------
async function initializeDatabase() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL
    );
  `);

  console.log('SQLite database initialized.');
}

// =====================================================
// USER ENDPOINTS
// =====================================================

// GET all users
app.get('/users', async (_req: Request, res: Response) => {
  const users = await db.all<User[]>('SELECT * FROM users');
  res.json(users);
});

// GET user by ID
app.get('/users/:id', async (req: Request, res: Response) => {
  const user = await db.get<User>(
    'SELECT * FROM users WHERE id = ?',
    req.params.id
  );

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(user);
});

// POST create user
app.post('/users', async (req: Request, res: Response) => {
  const { name, email }: User = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email required' });
  }

  const result = await db.run(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email]
  );

  const newUser = await db.get<User>(
    'SELECT * FROM users WHERE id = ?',
    result.lastID
  );

  res.status(201).json(newUser);
});

// PUT update user
app.put('/users/:id', async (req: Request, res: Response) => {
  const { name, email }: User = req.body;
  const { id } = req.params;

  const existingUser = await db.get<User>(
    'SELECT * FROM users WHERE id = ?',
    id
  );

  if (!existingUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  await db.run(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
    [name, email, id]
  );

  const updatedUser = await db.get<User>(
    'SELECT * FROM users WHERE id = ?',
    id
  );

  res.json(updatedUser);
});

// DELETE user
app.delete('/users/:id', async (req: Request, res: Response) => {
  const result = await db.run(
    'DELETE FROM users WHERE id = ?',
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(204).send();
});

// =====================================================
// PRODUCT ENDPOINTS
// =====================================================

// GET all products
app.get('/products', async (_req: Request, res: Response) => {
  const products = await db.all<Product[]>('SELECT * FROM products');
  res.json(products);
});

// GET product by ID
app.get('/products/:id', async (req: Request, res: Response) => {
  const product = await db.get<Product>(
    'SELECT * FROM products WHERE id = ?',
    req.params.id
  );

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
});

// POST create product
app.post('/products', async (req: Request, res: Response) => {
  const { name, price }: Product = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ message: 'Name and price required' });
  }

  const result = await db.run(
    'INSERT INTO products (name, price) VALUES (?, ?)',
    [name, price]
  );

  const newProduct = await db.get<Product>(
    'SELECT * FROM products WHERE id = ?',
    result.lastID
  );

  res.status(201).json(newProduct);
});

// PUT update product
app.put('/products/:id', async (req: Request, res: Response) => {
  const { name, price }: Product = req.body;
  const { id } = req.params;

  const existingProduct = await db.get<Product>(
    'SELECT * FROM products WHERE id = ?',
    id
  );

  if (!existingProduct) {
    return res.status(404).json({ message: 'Product not found' });
  }

  await db.run(
    'UPDATE products SET name = ?, price = ? WHERE id = ?',
    [name, price, id]
  );

  const updatedProduct = await db.get<Product>(
    'SELECT * FROM products WHERE id = ?',
    id
  );

  res.json(updatedProduct);
});

// DELETE product
app.delete('/products/:id', async (req: Request, res: Response) => {
  const result = await db.run(
    'DELETE FROM products WHERE id = ?',
    req.params.id
  );

  if (result.changes === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.status(204).send();
});

// -----------------------------
// Start Server
// -----------------------------
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
  });

// -----------------------------
// Required packages:
// npm install express sqlite sqlite3
// npm install -D typescript ts-node @types/express
// -----------------------------
