"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", !dark ? "dark" : "light");
  };

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-end px-4 gap-3">
      <button onClick={toggleDark} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      {session?.user && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {session.user.image && (
            <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
          )}
          <button onClick={() => signOut()} className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
}
