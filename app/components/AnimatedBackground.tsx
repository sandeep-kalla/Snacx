"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedBackgroundProps {
  variant?: 'memes' | 'particles' | 'waves' | 'geometric';
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export default function AnimatedBackground({
  variant = 'memes',
  intensity = 'medium',
  className = ''
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation variables
    let animationId: number;
    const particles: any[] = [];
    
    // Intensity settings
    const intensitySettings = {
      low: { count: 40, speed: 0.8, size: 1 },
      medium: { count: 80, speed: 1.2, size: 1.2 },
      high: { count: 120, speed: 1.8, size: 1.5 }
    };

    const settings = intensitySettings[intensity];

    // Initialize particles based on variant
    const initParticles = () => {
      particles.length = 0;
      
      for (let i = 0; i < settings.count; i++) {
        if (variant === 'memes') {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: (Math.random() * 25 + 15) * settings.size,
            speedX: (Math.random() - 0.5) * 3 * settings.speed,
            speedY: (Math.random() - 0.5) * 3 * settings.speed,
            emoji: ['😂', '🤣', '😭', '💀', '🔥', '👌', '😎', '🤔', '😍', '🥺', '🤡', '🗿', '💯', '🎉', '🚀', '🎭', '🤪', '👑', '🎪', '🎯', '🎨', '🎮'][Math.floor(Math.random() * 22)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 6,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.05 + 0.02,
            driftX: (Math.random() - 0.5) * 0.5,
            driftY: (Math.random() - 0.5) * 0.5
          });
        } else if (variant === 'particles') {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * settings.speed,
            speedY: (Math.random() - 0.5) * settings.speed,
            opacity: Math.random() * 0.5 + 0.1,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`
          });
        } else if (variant === 'geometric') {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 40 + 20,
            speedX: (Math.random() - 0.5) * settings.speed,
            speedY: (Math.random() - 0.5) * settings.speed,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2,
            shape: Math.floor(Math.random() * 3), // 0: triangle, 1: square, 2: circle
            color: `hsl(${Math.random() * 360}, 50%, 70%)`,
            opacity: 0.1
          });
        }
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (variant === 'waves') {
        // Draw animated waves
        const time = Date.now() * 0.001;
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          for (let x = 0; x <= canvas.width; x += 10) {
            const y = canvas.height / 2 + 
              Math.sin((x * 0.01) + (time * settings.speed) + (i * 0.5)) * 50 +
              Math.sin((x * 0.02) + (time * settings.speed * 1.5) + (i * 0.3)) * 30;
            
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      } else {
        // Update and draw particles
        particles.forEach(particle => {
          // Update position with enhanced movement
          particle.x += particle.speedX;
          particle.y += particle.speedY;

          // Add drift and pulse effects for meme variant
          if (variant === 'memes' && particle.driftX !== undefined) {
            particle.x += particle.driftX * Math.sin(Date.now() * 0.001);
            particle.y += particle.driftY * Math.cos(Date.now() * 0.001);

            // Update pulse phase
            if (particle.pulsePhase !== undefined) {
              particle.pulsePhase += particle.pulseSpeed;
            }
          }

          // Wrap around screen
          if (particle.x > canvas.width + 50) particle.x = -50;
          if (particle.x < -50) particle.x = canvas.width + 50;
          if (particle.y > canvas.height + 50) particle.y = -50;
          if (particle.y < -50) particle.y = canvas.height + 50;

          // Update rotation with enhanced speed
          if (particle.rotation !== undefined) {
            particle.rotation += particle.rotationSpeed;
          }

          // Draw particle
          ctx.save();
          ctx.translate(particle.x, particle.y);
          
          if (particle.rotation !== undefined) {
            ctx.rotate((particle.rotation * Math.PI) / 180);
          }

          if (variant === 'memes') {
            // Apply pulsing effect
            let currentSize = particle.size;
            if (particle.pulsePhase !== undefined) {
              const pulseMultiplier = 1 + Math.sin(particle.pulsePhase) * 0.3;
              currentSize = particle.size * pulseMultiplier;
            }

            ctx.font = `${currentSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Add slight glow effect
            ctx.shadowColor = 'rgba(139, 92, 246, 0.3)';
            ctx.shadowBlur = 8;

            ctx.fillText(particle.emoji, 0, 0);

            // Reset shadow
            ctx.shadowBlur = 0;
          } else if (variant === 'particles') {
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            ctx.fill();
          } else if (variant === 'geometric') {
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 2;

            if (particle.shape === 0) {
              // Triangle
              ctx.beginPath();
              ctx.moveTo(0, -particle.size / 2);
              ctx.lineTo(-particle.size / 2, particle.size / 2);
              ctx.lineTo(particle.size / 2, particle.size / 2);
              ctx.closePath();
              ctx.stroke();
            } else if (particle.shape === 1) {
              // Square
              ctx.strokeRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            } else {
              // Circle
              ctx.beginPath();
              ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          ctx.restore();
        });
      }

      animationId = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [variant, intensity]);

  if (!mounted) {
    return <div className={`fixed inset-0 pointer-events-none z-[1] ${className}`} />;
  }

  return (
    <div className={`fixed inset-0 pointer-events-none z-[1] ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-40 dark:opacity-30"
        style={{ mixBlendMode: 'soft-light' }}
      />
      
      {/* Static overlay elements */}
      <div className="absolute inset-0">
        {/* Floating meme-related icons */}
        {variant === 'memes' && (
          <>
            {/* Row 1 - Top emojis with enhanced randomness */}
            <motion.div
              animate={{
                y: [0, -25, 5, -15, 0],
                rotate: [0, 8, -12, 15, 0],
                scale: [1, 1.1, 0.9, 1.2, 1],
                x: [0, 15, -10, 8, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-16 left-8 text-4xl opacity-35"
            >
              😂
            </motion.div>

            <motion.div
              animate={{
                y: [0, 20, -8, 25, 0],
                rotate: [0, -5, 10, -8, 0],
                x: [0, 10, -15, 20, 0],
                scale: [1, 0.8, 1.3, 0.9, 1],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-24 right-16 text-3xl opacity-30"
            >
              🔥
            </motion.div>

            <motion.div
              animate={{
                y: [0, -15, 12, -20, 0],
                rotate: [0, 12, -18, 25, 0],
                scale: [1, 0.9, 1.4, 0.7, 1],
                x: [0, -12, 18, -8, 0],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute top-32 left-1/3 text-3xl opacity-25"
            >
              💀
            </motion.div>

            <motion.div
              animate={{
                y: [0, 18, -12, 22, 0],
                x: [0, -8, 25, -15, 0],
                rotate: [0, -6, 20, -12, 0],
                scale: [1, 1.2, 0.8, 1.1, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute top-20 right-1/3 text-2xl opacity-30"
            >
              🤡
            </motion.div>

            {/* Additional scattered top emojis */}
            <motion.div
              animate={{
                y: [0, -30, 15, -18, 0],
                x: [0, 22, -18, 12, 0],
                rotate: [0, 30, -20, 15, 0],
                scale: [1, 1.5, 0.6, 1.2, 1],
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3.2
              }}
              className="absolute top-12 left-1/2 text-2xl opacity-28"
            >
              🎪
            </motion.div>

            <motion.div
              animate={{
                y: [0, 25, -20, 18, 0],
                x: [0, -25, 30, -12, 0],
                rotate: [0, -25, 18, -10, 0],
                scale: [1, 0.7, 1.6, 0.9, 1],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4.8
              }}
              className="absolute top-8 right-1/4 text-3xl opacity-32"
            >
              🎯
            </motion.div>

            {/* Row 2 - Middle emojis with enhanced randomness */}
            <motion.div
              animate={{
                y: [0, -12, 20, -8, 0],
                x: [0, 15, -25, 18, 0],
                rotate: [0, 15, -30, 22, 0],
                scale: [1, 1.3, 0.6, 1.1, 1],
              }}
              transition={{
                duration: 13,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3
              }}
              className="absolute top-1/2 left-12 text-3xl opacity-30"
            >
              🤣
            </motion.div>

            <motion.div
              animate={{
                y: [0, 22, -15, 28, 0],
                rotate: [0, -8, 25, -15, 0],
                scale: [1, 1.2, 0.8, 1.4, 1],
                x: [0, -20, 15, -10, 0],
              }}
              transition={{
                duration: 8.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
              className="absolute top-1/2 right-24 text-4xl opacity-35"
            >
              😭
            </motion.div>

            <motion.div
              animate={{
                y: [0, -18, 25, -12, 0],
                x: [0, 12, -20, 16, 0],
                rotate: [0, 10, -25, 18, 0],
                scale: [1, 0.9, 1.5, 0.7, 1],
              }}
              transition={{
                duration: 10.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.5
              }}
              className="absolute top-1/2 left-1/2 text-2xl opacity-25"
            >
              🗿
            </motion.div>

            {/* Additional middle emojis */}
            <motion.div
              animate={{
                y: [0, -25, 18, -30, 0],
                x: [0, 28, -22, 15, 0],
                rotate: [0, 35, -28, 20, 0],
                scale: [1, 1.6, 0.5, 1.3, 1],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 5.2
              }}
              className="absolute top-2/5 left-1/4 text-4xl opacity-38"
            >
              🎉
            </motion.div>

            <motion.div
              animate={{
                y: [0, 20, -22, 25, 0],
                x: [0, -18, 32, -15, 0],
                rotate: [0, -22, 28, -18, 0],
                scale: [1, 0.8, 1.4, 0.9, 1],
              }}
              transition={{
                duration: 9.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 6.5
              }}
              className="absolute top-3/5 right-1/3 text-3xl opacity-33"
            >
              🚀
            </motion.div>

            {/* Row 3 - Bottom emojis with enhanced randomness */}
            <motion.div
              animate={{
                y: [0, -20, 15, -25, 0],
                x: [0, -10, 25, -18, 0],
                rotate: [0, -12, 30, -20, 0],
                scale: [1, 1.2, 0.7, 1.4, 1],
              }}
              transition={{
                duration: 11.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4
              }}
              className="absolute bottom-32 left-16 text-3xl opacity-30"
            >
              💯
            </motion.div>

            <motion.div
              animate={{
                y: [0, 16, -22, 20, 0],
                rotate: [0, 6, -28, 15, 0],
                scale: [1, 0.8, 1.5, 0.6, 1],
                x: [0, 12, -20, 8, 0],
              }}
              transition={{
                duration: 7.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.8
              }}
              className="absolute bottom-24 right-12 text-2xl opacity-25"
            >
              🤪
            </motion.div>

            <motion.div
              animate={{
                y: [0, -14, 28, -18, 0],
                x: [0, 8, -30, 22, 0],
                rotate: [0, 20, -35, 25, 0],
                scale: [1, 1.1, 0.5, 1.6, 1],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3.5
              }}
              className="absolute bottom-40 right-1/4 text-3xl opacity-30"
            >
              🎭
            </motion.div>

            <motion.div
              animate={{
                y: [0, 25, -18, 30, 0],
                rotate: [0, -15, 32, -22, 0],
                scale: [1, 1.3, 0.8, 1.5, 1],
                x: [0, -15, 20, -8, 0],
              }}
              transition={{
                duration: 9.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.2
              }}
              className="absolute bottom-16 left-1/4 text-4xl opacity-35"
            >
              🚀
            </motion.div>

            {/* Additional bottom scattered emojis */}
            <motion.div
              animate={{
                y: [0, -35, 22, -28, 0],
                x: [0, 35, -25, 18, 0],
                rotate: [0, 40, -30, 25, 0],
                scale: [1, 1.7, 0.4, 1.3, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 7.2
              }}
              className="absolute bottom-8 right-1/2 text-5xl opacity-42"
            >
              🎨
            </motion.div>

            <motion.div
              animate={{
                y: [0, 18, -25, 22, 0],
                x: [0, -22, 28, -15, 0],
                rotate: [0, -18, 35, -25, 0],
                scale: [1, 0.9, 1.4, 0.7, 1],
              }}
              transition={{
                duration: 13.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 8.8
              }}
              className="absolute bottom-20 left-1/3 text-2xl opacity-28"
            >
              👑
            </motion.div>

            {/* Additional scattered emojis with extreme randomness */}
            <motion.div
              animate={{
                y: [0, -8, 25, -18, 12, 0],
                x: [0, 6, -22, 15, -8, 0],
                rotate: [0, 5, -35, 20, -15, 0],
                scale: [1, 1.3, 0.6, 1.5, 0.8, 1],
              }}
              transition={{
                duration: 16,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.8
              }}
              className="absolute top-3/4 left-8 text-2xl opacity-20"
            >
              👑
            </motion.div>

            <motion.div
              animate={{
                y: [0, 12, -28, 20, -15, 0],
                rotate: [0, -10, 40, -25, 18, 0],
                scale: [1, 0.9, 1.6, 0.5, 1.2, 1],
                x: [0, 18, -25, 12, -8, 0],
              }}
              transition={{
                duration: 14.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4.5
              }}
              className="absolute top-1/4 right-8 text-2xl opacity-25"
            >
              🎪
            </motion.div>

            <motion.div
              animate={{
                y: [0, -30, 22, -35, 18, 0],
                x: [0, 20, -35, 25, -12, 0],
                rotate: [0, 25, -45, 30, -20, 0],
                scale: [1, 1.4, 0.4, 1.8, 0.7, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 5
              }}
              className="absolute top-1/3 left-20 text-5xl opacity-40"
            >
              🎉
            </motion.div>

            <motion.div
              animate={{
                y: [0, 14, -32, 25, -18, 0],
                x: [0, -12, 30, -20, 15, 0],
                rotate: [0, -18, 42, -28, 22, 0],
                scale: [1, 1.2, 0.5, 1.6, 0.8, 1],
              }}
              transition={{
                duration: 17.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3.8
              }}
              className="absolute bottom-1/3 right-20 text-3xl opacity-32"
            >
              🎯
            </motion.div>

            <motion.div
              animate={{
                y: [0, -22, 28, -25, 15, 0],
                rotate: [0, 14, -38, 25, -18, 0],
                scale: [1, 1.1, 0.6, 1.7, 0.9, 1],
                x: [0, 20, -28, 18, -10, 0],
              }}
              transition={{
                duration: 15.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2
              }}
              className="absolute top-2/3 right-1/3 text-3xl opacity-28"
            >
              🎨
            </motion.div>

            <motion.div
              animate={{
                y: [0, 19, -25, 22, -12, 0],
                x: [0, 14, -30, 20, -8, 0],
                rotate: [0, -22, 35, -28, 20, 0],
                scale: [1, 0.8, 1.5, 0.6, 1.3, 1],
              }}
              transition={{
                duration: 19,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4.2
              }}
              className="absolute bottom-1/4 left-1/3 text-2xl opacity-22"
            >
              🎮
            </motion.div>

            {/* Extra random floating emojis */}
            <motion.div
              animate={{
                y: [0, -40, 30, -25, 35, 0],
                x: [0, 35, -40, 28, -20, 0],
                rotate: [0, 50, -40, 35, -25, 0],
                scale: [1, 1.8, 0.3, 1.6, 0.7, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 9.5
              }}
              className="absolute top-1/6 left-3/4 text-4xl opacity-45"
            >
              💀
            </motion.div>

            <motion.div
              animate={{
                y: [0, 25, -35, 30, -20, 0],
                x: [0, -30, 40, -25, 18, 0],
                rotate: [0, -35, 45, -30, 25, 0],
                scale: [1, 0.6, 1.9, 0.8, 1.4, 1],
              }}
              transition={{
                duration: 21,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 11.2
              }}
              className="absolute bottom-1/6 right-1/5 text-3xl opacity-38"
            >
              🤡
            </motion.div>
          </>
        )}

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-background/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
