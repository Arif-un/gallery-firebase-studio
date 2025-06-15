"use client";

import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,180,0.2),rgba(0,0,0,0))]" />
      <div className="mesh-gradient" />
      <style jsx>{`
        .mesh-gradient {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(at 0% 0%, rgba(88, 28, 135, 0.35) 0, transparent 50%),
            radial-gradient(at 98% 1%, rgba(49, 46, 129, 0.25) 0, transparent 50%),
            radial-gradient(at 100% 100%, rgba(79, 70, 229, 0.45) 0, transparent 50%),
            radial-gradient(at 0% 100%, rgba(124, 58, 237, 0.35) 0, transparent 50%);
          animation: gradient 15s ease infinite;
          background-size: 200% 200%;
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground; 