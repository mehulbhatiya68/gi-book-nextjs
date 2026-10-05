"use client";

import { motion, AnimatePresence } from "motion/react";
import { IoLogOutOutline, IoClose } from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";

export default function LogoutConfirmModal() {
  const { showLogoutModal, confirmLogout, cancelLogout } = useAuth();

  return (
    <AnimatePresence>
      {showLogoutModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xs gi-modal-overlay"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm rounded-2xl gi-modal-content p-6 shadow-2xl space-y-4 text-center border gi-divider relative"
          >
            <button
              type="button"
              onClick={cancelLogout}
              className="absolute top-3.5 right-3.5 p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
              title="Close"
            >
              <IoClose className="text-lg" />
            </button>

            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shrink-0">
              <IoLogOutOutline className="text-2xl" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold gi-text-primary tracking-tight">
                Confirm Log Out
              </h3>
              <p className="text-xs gi-text-secondary leading-relaxed">
                Are you sure you want to log out of your account? You will need to enter your credentials again to access your business ledgers.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={cancelLogout}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-md transition flex items-center justify-center gap-1.5"
              >
                <IoLogOutOutline className="text-base" />
                <span>Yes, Log Out</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

