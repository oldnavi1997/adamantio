"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-[#d5d5d5]">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-left gap-4 group"
          >
            <span className="text-[15px] text-[#111111] font-light leading-snug group-hover:text-[#d4af37] transition-colors">
              {item.question}
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-[#d4af37] transition-transform duration-200 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === i && (
            <p className="pb-5 text-[#111111]/70 text-[15px] leading-relaxed whitespace-pre-line">
              {item.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
