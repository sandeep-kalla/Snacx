"use client";

import React, { Suspense } from "react";
import { motion } from "framer-motion";
import FollowingFeed from "../components/FollowingFeed";

export default function FollowingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-4 sm:py-8"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
          <FollowingFeed />
        </Suspense>
      </div>
    </motion.div>
  );
}
