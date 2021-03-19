import React from "react";
import image from "../images/matcha.jpg";

export default function Home() {
  return (
    <main>
      <img src={image} alt="Matcha" className="absolute object-cover w-full" />
      <section className="relative flex justify-center min-h-screen pt-12 lg:pt-64 px-8">
        <h1 className="text-sm text-gray-50 font-bold cursive  leading-none md:leading-snug home-name">Welcome</h1>
      </section>
    </main>
  );
}
