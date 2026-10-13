"use client";

import { useEffect, useState } from "react";

const hellos = ["Hello", "Bawo ni", "Привет", "Hola", "Bonjour", "Sannu", "Ciao", "Hallo", "Kedu", "Olá", "こんにちは", "Jambo"];

/** Cycles "Hello" through languages, starting in English so SSR and hydration agree. */
export function Greeting({ name }: { name: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % hellos.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <h1 className="text-lg font-semibold tracking-tight">
      <span key={i} className="inline-block animate-fade-up">
        {hellos[i]}
      </span>
      , {name}!
    </h1>
  );
}
