import { Instagram, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bone pt-32 pb-8 px-4 md:px-12 border-t border-charcoal/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-32">
          
          {/* Column 1: Brand */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tighter uppercase font-sans text-charcoal">XOOMS</h3>
            <p className="font-serif text-lg leading-relaxed text-charcoal/80 max-w-xs">
              Verified Living Standards for the modern resident. No compromises, just clarity.
            </p>
          </div>

          {/* Column 2: Explore */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Explore</h4>
            <ul className="space-y-4">
              {['Boys PGs', 'Girls PGs', 'Serviced Apartments', 'Short Stays', 'Corporate Housing'].map((item) => (
                <li key={item}>
                  <a href="#" className="font-sans text-sm text-charcoal/70 hover:text-charcoal transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Support</h4>
            <ul className="space-y-4">
              {['Help Center', 'Verification Process', 'List Your Property', 'Resident FAQs', 'Safety Standards'].map((item) => (
                <li key={item}>
                  <a href="#" className="font-sans text-sm text-charcoal/70 hover:text-charcoal transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Social */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-charcoal/10 flex items-center justify-center text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-charcoal/10 flex items-center justify-center text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-charcoal/10 flex items-center justify-center text-charcoal hover:bg-charcoal hover:text-white transition-all duration-300">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-charcoal/5">
          <p className="font-sans text-[10px] uppercase tracking-widest text-charcoal/40 mb-4 md:mb-0">
            © 2024 XOOMS Inc. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="font-sans text-[10px] uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors">Privacy Policy</a>
            <a href="#" className="font-sans text-[10px] uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors">Terms of Service</a>
            <a href="#" className="font-sans text-[10px] uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors">Sitemap</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
