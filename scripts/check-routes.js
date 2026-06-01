const routes = [
  '/',
  '/invoice-demo',
  '/login',
  '/register',
  '/wishlist',
  '/profile',
  '/admin',
  '/admin/wishlists'
];

const base = process.env.BASE_URL || 'http://localhost:3000';

async function check() {
  for (const r of routes) {
    const url = base + r;
    try {
      const res = await fetch(url, { method: 'GET' });
      console.log(`${r} -> ${res.status} ${res.statusText}`);
    } catch (err) {
      console.log(`${r} -> ERROR: ${err.message}`);
    }
  }
}

check();
