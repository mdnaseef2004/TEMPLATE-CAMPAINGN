"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import { Menu, X, LayoutDashboard, Shield, LogOut, User, Image as ImageIcon } from "lucide-react";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-opacity-30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-102">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-pink-500 shadow-md">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold tracking-tight text-xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                TwibbonCraft
              </span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${
                    isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${
                      isActive("/admin") ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-warning" />
                    Admin Panel
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            
            {loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light border border-primary/20">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {user.displayName?.split(" ")[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full glass-panel hover:bg-red-500/10 text-red-500 border border-red-500/20 hover:scale-105 active:scale-95 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium hover:text-primary transition-colors px-3 py-1.5"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-102 active:scale-98"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl glass-panel text-foreground"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-opacity-30 p-4 space-y-4 animate-in fade-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                isActive("/") ? "bg-primary-light text-primary" : "hover:bg-primary-light/5"
              }`}
            >
              Home
            </Link>

            {user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                    isActive("/dashboard") ? "bg-primary-light text-primary" : "hover:bg-primary-light/5"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                      isActive("/admin") ? "bg-primary-light text-primary" : "hover:bg-primary-light/5"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-warning" />
                    Admin Panel
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="border-t border-opacity-20 pt-4">
            {loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
            ) : user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{user.displayName}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 text-sm text-red-500 font-medium px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center font-medium py-2 rounded-xl hover:bg-primary-light/5 transition-colors text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center font-medium py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm transition-all shadow-md"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
