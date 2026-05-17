'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './CartContext';

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/cart', label: 'Cart', icon: '🛒' },
  { href: '/orders', label: '📦', icon: 'Orders' },
  { href: '/support-tickets', label: '💬', icon: 'Support' },
  { href: '/profile', label: '👤', icon: 'Account' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_-10px_30px_rgba(15,23,42,0.08)] md:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex flex-col items-center justify-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold transition ${
                active ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/cart"
          className={`inline-flex flex-col items-center justify-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold transition ${
            pathname === '/cart' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>🛒</span>
          <span>Cart</span>
          {itemCount > 0 && <span className="mt-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-2 text-[10px] font-bold text-white">{itemCount}</span>}
        </Link>
      </div>
    </nav>
  );
}
