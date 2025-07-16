"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BadgeExplanationService } from "../../../lib/badgeExplanationService";
import { useAuth } from "../../context/AuthContext";
import { useAdmin } from "../../context/AdminContext";

export default function AdminInitPage() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const initializeBadges = async () => {
    if (!isAdmin) {
      setError("Admin access required");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("Initializing badge explanations...");

    try {
      await BadgeExplanationService.initializeBadgeExplanations();
      setStatus("✅ Badge explanations initialized successfully!");
    } catch (err) {
      console.error("Error initializing badges:", err);
      setError("❌ Failed to initialize badge explanations");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Authentication Required
          </h1>
          <p className="text-text-secondary">Please sign in to access admin features.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Admin Access Required
          </h1>
          <p className="text-text-secondary">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg border border-primary/20 p-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-6">
            🔧 Admin Initialization
          </h1>
          
          <div className="space-y-6">
            {/* Badge Explanations Section */}
            <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                🏆 Badge Explanations
              </h2>
              
              <p className="text-text-secondary mb-4">
                Initialize the badge explanation system. This will create all badge definitions
                in the database that are used to explain achievements and levels to users.
              </p>
              
              <button
                onClick={initializeBadges}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  loading
                    ? "bg-secondary text-text-secondary cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-light shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? "Initializing..." : "Initialize Badge Explanations"}
              </button>
              
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg"
                >
                  <p className="text-green-800 dark:text-green-200">{status}</p>
                </motion.div>
              )}
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg"
                >
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </motion.div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                📋 Instructions
              </h3>
              <ul className="space-y-2 text-blue-700 dark:text-blue-300">
                <li>• Run badge initialization once to set up the explanation system</li>
                <li>• This will create badge definitions for all achievements and levels</li>
                <li>• Users will be able to click on badges to see detailed explanations</li>
                <li>• Safe to run multiple times - will update existing badges</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
