"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const { data: session, status } = useSession();

  const isDisabled = status === "loading" || isAuthLoading;

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    await signIn();
    setIsAuthLoading(false);
  };

  const handleSignOut = async () => {
    setIsAuthLoading(true);
    await signOut();
    setIsAuthLoading(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-lg">
                ♪
              </span>
            </div>
            <span className="font-bold text-lg text-foreground">MuSync</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-foreground hover:text-accent text-sm"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-foreground hover:text-accent text-sm"
            >
              How It Works
            </Link>

            {session?.user ? (
              <button
                onClick={handleSignOut}
                disabled={isDisabled}
                className={`px-6 py-2 bg-red-500 text-white rounded-lg font-semibold transition-opacity cursor-pointer
                  ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isDisabled}
                className={`px-6 py-2 bg-accent text-accent-foreground rounded-lg font-semibold transition-opacity cursor-pointer
                  ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-4">
            <Link
              href="#features"
              className="block text-foreground hover:text-accent"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="block text-foreground hover:text-accent"
            >
              How It Works
            </Link>

            {session?.user ? (
              <button
                onClick={handleSignOut}
                disabled={isDisabled}
                className={`w-full px-4 py-2 bg-red-500 text-white rounded-lg font-semibold transition-opacity
                  ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isDisabled}
                className={`w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold transition-opacity
                  ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
