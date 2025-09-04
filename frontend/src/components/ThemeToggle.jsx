// frontend/src/components/ThemeToggle.jsx
import React from "react";
import { useTheme } from "../context/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-11 h-11 flex items-center justify-center 
                 rounded-fullbg-gray-800 
                  hover:bg-gray-700 
                 transition-colors duration-300"
      title={`Переключить на ${
        theme === "light" ? "темную" : "светлую"
      } тему`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "light" ? (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
            <Sun className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
            <Moon className="h-6 w-6 text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.6)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default ThemeToggle;
