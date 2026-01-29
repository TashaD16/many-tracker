import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Tag,
  Wallet,
  ArrowLeftRight,
  Target,
  DollarSign,
  FileText,
  LogOut,
  User
} from 'lucide-react';
import { Button } from './ui/button';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { cn } from '../lib/utils';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user, profile } = useSupabaseAuth();

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Transactions', path: '/transactions', icon: Receipt },
    { label: 'Categories', path: '/categories', icon: Tag },
    { label: 'Accounts', path: '/accounts', icon: Wallet },
    { label: 'Transfers', path: '/transfers', icon: ArrowLeftRight },
    { label: 'Budgets', path: '/budgets', icon: Target },
    { label: 'Currency', path: '/currency', icon: DollarSign },
    { label: 'Reports', path: '/reports', icon: FileText }
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">Money Tracker</h1>
          <div className="flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "gap-2",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {profile?.name || user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
