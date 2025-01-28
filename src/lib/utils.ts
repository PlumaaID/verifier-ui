import { type ClassValue, clsx } from "clsx";
import { Hex } from "node-forge";
import { twMerge } from "tailwind-merge";

export function with0x(str: string): Hex {
  const without0xStr = without0x(str);
  return `0x${
    without0xStr.length % 2 === 0 ? without0xStr : `0${without0xStr}`
  }`;
}

export function without0x(str: string): string {
  if (!str) return str;
  return str.replace(/^0x/, "");
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
