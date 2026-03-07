import { motion } from 'motion/react';
import SearchPill from './SearchPill';

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full pt-32 pb-20 px-4 md:px-12 flex flex-col items-center overflow-hidden">
      
      {/* Headline */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mb-16 z-10 relative"
      >
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light leading-[0.9] text-charcoal mb-6">
          <span className="italic">Verified</span> Living Standards
        </h1>
        <p className="font-sans text-sm md:text-base tracking-wide text-charcoal/60 w-full max-w-2xl mx-auto whitespace-nowrap">
          Bridging the gap between premium expectations and rental reality.
        </p>
      </motion.div>

      {/* Search Pill */}
      <div className="z-20 w-full flex justify-center mb-20 md:mb-32">
        <SearchPill />
      </div>

      {/* Arch Gallery */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="relative w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 items-end"
      >
        
        {/* Decorative Swirl - Absolute positioned behind */}
        <div className="absolute top-1/4 left-0 w-full h-full -z-10 pointer-events-none opacity-20 hidden md:block">
           <svg viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
             <path d="M100,300 C250,100 400,500 600,300 C800,100 950,500 1100,300" stroke="#1A1A1A" strokeWidth="2" strokeDasharray="10 10" />
           </svg>
        </div>

        {/* Left Arch: Boys PGs */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 100 },
            visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.2 } }
          }}
          className="relative group cursor-pointer"
        >
          <div className="h-[400px] md:h-[500px] w-full overflow-hidden rounded-t-[500px] rounded-b-lg relative">
            <img 
              src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop" 
              alt="Boys PG" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-60" />
            <div className="absolute bottom-8 left-0 w-full text-center">
              <span className="text-white font-serif text-3xl italic">Boys PGs</span>
            </div>
          </div>
        </motion.div>

        {/* Center Arch: Premium Apartments */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 100 },
            visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.1 } }
          }}
          className="relative group cursor-pointer -mt-12 md:-mt-24"
        >
          <div className="h-[500px] md:h-[650px] w-full overflow-hidden rounded-t-[500px] rounded-b-lg relative shadow-2xl shadow-charcoal/10">
            <img 
              src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop" 
              alt="Serviced Apartments" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-60" />
            <div className="absolute bottom-10 left-0 w-full text-center">
              <span className="text-white font-serif text-4xl italic">Serviced Apartments</span>
            </div>
          </div>
        </motion.div>

        {/* Right Arch: Girls PGs */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 100 },
            visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.2 } }
          }}
          className="relative group cursor-pointer"
        >
          <div className="h-[350px] md:h-[450px] w-full overflow-hidden rounded-t-[500px] rounded-b-lg relative">
            <img 
              src="https://images.unsplash.com/photo-1617104424032-b9bd6972d0e4?q=80&w=2070&auto=format&fit=crop" 
              alt="Girls PG" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-60" />
            <div className="absolute bottom-8 left-0 w-full text-center">
              <span className="text-white font-serif text-3xl italic">Girls PGs</span>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}
