import { motion, AnimatePresence } from 'motion/react';

interface WelcomeScreenProps {
  name: string;
}

export default function WelcomeScreen({ name }: WelcomeScreenProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[100] bg-bone flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-4">
            Welcome, {name || 'there'}
          </h1>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
            className="h-px w-24 bg-charcoal mx-auto"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
