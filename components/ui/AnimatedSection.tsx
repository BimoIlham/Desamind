'use client';
import { motion } from 'framer-motion';

export type AnimationType = 'fade-up' | 'fade-down' | 'fade-from-left' | 'fade-from-right' | 'zoom-in' | 'blur-in';

interface AnimatedProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: AnimationType;
  as?: 'div' | 'section';
}

export function AnimatedSection({ children, className = '', delay = 0, animation = 'fade-up', as = 'section' }: AnimatedProps) {
  const getInitial = () => {
    switch (animation) {
      case 'fade-up': return { opacity: 0, y: 50, filter: 'blur(4px)' };
      case 'fade-down': return { opacity: 0, y: -50, filter: 'blur(4px)' };
      case 'fade-from-left': return { opacity: 0, x: -60, filter: 'blur(4px)' };
      case 'fade-from-right': return { opacity: 0, x: 60, filter: 'blur(4px)' };
      case 'zoom-in': return { opacity: 0, scale: 0.9, filter: 'blur(8px)' };
      case 'blur-in': return { opacity: 0, filter: 'blur(10px)' };
      default: return { opacity: 0, y: 50, filter: 'blur(4px)' };
    }
  };

  const Component = as === 'section' ? motion.section : motion.div;

  return (
    <Component
      className={className}
      initial={getInitial()}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Component>
  );
}
