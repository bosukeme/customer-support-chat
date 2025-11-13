'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Headphones, ShieldCheck } from 'lucide-react';
import React from 'react';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  const router = useRouter();

  const roles = [
    {
      title: 'Customer',
      description: 'Start a chat with support and get help quickly.',
      path: '/customer',
      colorClass: 'bg-blue-500',
      icon: <User size={44} />,
      glowColor: 'rgba(59,130,246,0.18)', // blue
    },
    {
      title: 'Agent',
      description: 'Assist customers and manage ongoing conversations.',
      path: '/agent',
      colorClass: 'bg-green-500',
      icon: <Headphones size={44} />,
      glowColor: 'rgba(34,197,94,0.16)', // green
    },
    {
      title: 'Supervisor',
      description: 'Oversee chats and monitor team performance.',
      path: '/supervisor',
      colorClass: 'bg-purple-600',
      icon: <ShieldCheck size={44} />,
      glowColor: 'rgba(139,92,246,0.16)', // purple
    },
  ];

  const go = (path: string) => router.push(path);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-blue-50 to-white">

        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl font-extrabold text-blue-700 mb-3">
            Welcome to SupportChat
          </h1>
          <p className="text-gray-600 text-lg">
            Choose your role to continue
          </p>
        </div>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
          {roles.map((role) => (
            <motion.div
              key={role.title}
              role="button"
              tabIndex={0}
              onClick={() => go(role.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  go(role.path);
                }
              }}
              whileHover={{
                scale: 1.05,
                boxShadow: `0 18px 40px ${role.glowColor}`,
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className={`${role.colorClass} text-white rounded-2xl p-8 cursor-pointer shadow-md flex flex-col items-center justify-center text-center select-none`}
            >
              <div className="p-3 rounded-full bg-white/20 mb-4">
                {role.icon}
              </div>

              <h2 className="text-2xl font-semibold mb-2">{role.title}</h2>
              <p className="max-w-xs text-sm opacity-90">{role.description}</p>
              <span className="mt-6 inline-block px-4 py-2 text-sm bg-white/10 rounded-full">
                Continue →
              </span>
            </motion.div>
          ))}
        </div>

        <footer className="mt-16 text-sm text-gray-500">
          © {new Date().getFullYear()} SupportChat. All rights reserved.
        </footer>
      </div>
  );
}
