'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Home, History, BarChart3, LogOut, Users } from 'lucide-react';
import Image from 'next/image';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'New Enquiry', icon: Home },
    { href: '/history', label: 'History', icon: History },
    { href: '/dmc', label: 'DMC Master', icon: Users },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      signOut({ callbackUrl: '/login' });
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
      <div className="p-4 border-b border-gray-100 flex justify-center">
        <Image
          src="/images/finLogo.png"
          alt="Company Logo"
          width={120}
          height={50}
          className="object-contain"
          priority
        />
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md w-full transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}