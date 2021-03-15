import React from "react";
import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="bg-green-600">
      <div className="container mx-auto flex justify-between">
        <nav className="flex">
          <NavLink
            to="/"
            exact
            activeClassName="text-white"
            className="inflex-flex items-center py-6 px-3 mr-4 text-red-100 hover:text-green-800 text-4xl font-bold cursive tracking-widest"
          >
            Aldo
          </NavLink>
          <NavLink
            to="/post"
            activeClassName="text-green-100 bg-green-700"
            className="inflex-flex items-center py-3 px-3 my-6 rounded text-green-200 hover:text-green-800"
          >
            Blog Posts
          </NavLink>
          <NavLink
            to="/project"
            activeClassName="text-green-100 bg-green-700"
            className="inflex-flex items-center py-3 px-3 my-6 rounded text-green-200 hover:text-green-800"
          >
            Projects
          </NavLink>
          <NavLink
            to="/about"
            activeClassName="text-green-100 bg-green-700"
            className="inflex-flex items-center py-3 px-3 my-6 rounded text-green-200 hover:text-green-800"
          >
            About
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
