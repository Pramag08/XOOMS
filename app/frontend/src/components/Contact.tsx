import { motion } from 'motion/react';
import { useRef, useState, type MouseEvent } from 'react';

export default function Contact() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.3;
    const y = (clientY - (top + height / 2)) * 0.3;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <section className="py-24 px-4 md:px-12 bg-bone border-t border-charcoal/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Headline */}
        <div className="pr-0 lg:pr-12">
          <h2 className="font-serif text-5xl md:text-7xl text-charcoal leading-none mb-6">
            Let's find your <br/>
            <span className="italic text-charcoal/70">standard.</span>
          </h2>
          <p className="font-sans text-charcoal/60 max-w-md">
            Our concierge team is ready to curate a list of verified properties that match your specific requirements.
          </p>
        </div>

        {/* Right: Form */}
        <div className="space-y-12">
          <div className="group">
            <label className="block text-[10px] uppercase tracking-widest text-charcoal/50 mb-2">Name</label>
            <input 
              type="text" 
              placeholder="Enter your name" 
              className="w-full bg-transparent border-b border-charcoal/20 py-4 text-xl font-serif text-charcoal placeholder:text-charcoal/30 outline-none focus:border-charcoal transition-colors"
            />
          </div>
          
          <div className="group">
            <label className="block text-[10px] uppercase tracking-widest text-charcoal/50 mb-2">Email</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full bg-transparent border-b border-charcoal/20 py-4 text-xl font-serif text-charcoal placeholder:text-charcoal/30 outline-none focus:border-charcoal transition-colors"
            />
          </div>

          <div className="pt-8">
            <motion.button
              ref={btnRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              animate={{ x: position.x, y: position.y }}
              transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
              className="relative px-12 py-6 bg-charcoal text-white rounded-full overflow-hidden group"
            >
              <span className="relative z-10 font-sans text-xs uppercase tracking-[0.2em] font-medium">
                Start Concierge
              </span>
              <div className="absolute inset-0 bg-charcoal group-hover:bg-black transition-colors duration-300" />
            </motion.button>
          </div>
        </div>

      </div>
    </section>
  );
}
