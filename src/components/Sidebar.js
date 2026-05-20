'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Home, History, BarChart3, LogOut, Users, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = () => (
    <>
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
              onClick={() => setIsMobileMenuOpen(false)}
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
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Desktop sidebar (always visible on large screens) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 shadow-sm flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-end p-2">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-gray-500"
          >
            <X size={24} />
          </button>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
}