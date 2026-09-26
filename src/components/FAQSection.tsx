import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MapPin, Sparkles } from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: "Do you travel, or do I come to the studio?",
    answer: "Both! People want to know how it works: they can come to me, or I can come to them within my range. If I travel at all for any reason, I am factoring that travel time into the final total of the ink. Travel within my standard zone coverage is $1.00 per mile plus tax."
  },
  {
    id: 2,
    question: "What are your travel fees outside of the 100-mile zone?",
    answer: "I will travel outside of the standard radius for special custom work, but fees apply. Every 10 miles outside of the 100-mile zone is $10 plus tax, according to that zone. Standard travel outside the zone is calculated at $1.50 a mile plus tax."
  },
  {
    id: 3,
    question: "Do you do Tattoo Parties?",
    answer: "Yes! Tattoo parties can be reserved and booked. For a party, it's an even flat rate of $1,500 for 8 hours of ink."
  },
  {
    id: 4,
    question: "What does the Tattoo Party rate include?",
    answer: "The $1,500 rate includes work for up to 7 people with small tattoo sizes, and travel fees within my standard zone. All prices are subject to change according to style, placement of ink, scope of the project, and location of the party."
  },
  {
    id: 5,
    question: "What if a Tattoo Party is outside your standard coverage zone?",
    answer: "Outside of zone coverage for parties includes a travel fee of $2.00 a mile plus tax. This covers the amount of work involved and equipment being used, such as ink, needles, and gloves."
  },
  {
    id: 6,
    question: "Are your prices fixed?",
    answer: "Final pricing is negotiable and subject to change based on the specifics of your project, size, and location."
  },
  {
    id: 7,
    question: "Do you design custom artwork or edit existing designs?",
    answer: "Have artwork you want customized, or would you like Tex to edit previous designs from another studio or artist? It is $30/hr for custom drawings and reworked stencils from another artist. This is pricing without getting a tattoo. If you book with Tex, your artwork is included within the final tattoo work pricing."
  }
];

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(1); // Default open first

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto" id="faq-section">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-400/40 text-cyan-400 font-mono font-bold text-xs uppercase tracking-widest mb-3 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
          <HelpCircle className="w-4 h-4" />
          <span>Need to know</span>
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl font-black text-white">
          FREQUENTLY ASKED <span className="text-cyan-400">QUESTIONS</span>
        </h2>
        <p className="text-gray-400 font-tech text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
          Everything you need to know about travel rates, tattoo parties, and pricing policies before you book your next session with Tex.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <div 
            key={faq.id}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              openId === faq.id 
                ? 'bg-gradient-to-br from-cyan-950/40 to-[#061226] border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]' 
                : 'bg-black/60 border-gray-800/80 hover:border-cyan-500/30'
            }`}
          >
            <button
              onClick={() => toggleFaq(faq.id)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none"
            >
              <h3 className={`font-heading font-bold text-sm sm:text-base pr-4 ${openId === faq.id ? 'text-white' : 'text-gray-200'}`}>
                {faq.question}
              </h3>
              <div className={`shrink-0 p-1.5 rounded-full transition-colors ${
                openId === faq.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-900 text-gray-500'
              }`}>
                {openId === faq.id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>
            
            <div 
              className={`px-4 sm:px-5 font-mono text-xs sm:text-sm text-gray-400 leading-relaxed transition-all duration-300 ${
                openId === faq.id ? 'pb-5 opacity-100 max-h-96' : 'pb-0 opacity-0 max-h-0'
              }`}
            >
              <div className="pt-2 border-t border-cyan-500/10">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
