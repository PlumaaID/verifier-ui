"use client";
import { useTheme } from "next-themes";

import { Button } from "../ui/button";
import { Moon, Sun } from "lucide-react";
import Logo from "./logo";
import Link from "next/link";

const Topbar = () => {
  const { setTheme, theme } = useTheme();

  return (
    <div className="border-b fixed left-0 right-0 bg-background z-10">
      <div className="flex h-16 items-center px-8 mx-auto max-w-6xl">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex flex-1 ml-5 items-center space-x-4">
          <Button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            size="icon"
            variant="ghost"
            className="ml-auto"
          >
            <Sun className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
