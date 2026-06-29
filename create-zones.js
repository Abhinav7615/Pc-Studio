const zones = [
  {
    key: 'header-banner',
    title: 'Header Banner',
    description: 'Top banner in website header',
    sizes: ['728x90', '970x90', '1200x100'],
    status: 'enabled',
    priority: 10
  },
  {
    key: 'footer-banner',
    title: 'Footer Banner',
    description: 'Footer advertisement zone',
    sizes: ['728x90', '970x90'],
    status: 'enabled',
    priority: 5
  },
  {
    key: 'sidebar-vertical',
    title: 'Sidebar Vertical',
    description: 'Right sidebar vertical ads',
    sizes: ['300x600', '300x1050'],
    status: 'enabled',
    priority: 8
  },
  {
    key: 'homepage-top',
    title: 'Homepage Top',
    description: 'Top section of homepage',
    sizes: ['970x250', '728x90'],
    status: 'enabled',
    priority: 9
  },
  {
    key: 'product-sidebar',
    title: 'Product Page Sidebar',
    description: 'Sidebar ads on product pages',
    sizes: ['300x600'],
    status: 'enabled',
    priority: 7
  }
];

async function createZones() {
  for (const zone of zones) {
    try {
      const res = await fetch('http://localhost:3000/api/admin/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zone)
      });
      const data = await res.json();
      console.log(`✅ Zone '${zone.key}' created - Status: ${res.status}`);
      if (data._id) console.log(`   ID: ${data._id}`);
    } catch (err) {
      console.log(`❌ Zone '${zone.key}' failed: ${err.message}`);
    }
  }
}

createZones();
