"use client";

import { usePathname } from "next/navigation";

const WA_URL = "https://wa.me/51997676742";

export default function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg hover:bg-[#1ebe5d] hover:scale-110 transition-all duration-300"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="w-7 h-7 fill-white"
      >
        <path d="M16 0C7.164 0 0 7.163 0 16c0 2.822.736 5.469 2.027 7.77L0 32l8.463-2.004A15.935 15.935 0 0 0 16 32c8.836 0 16-7.163 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.763-1.843l-.485-.287-5.024 1.19 1.238-4.895-.317-.503A13.265 13.265 0 0 1 2.667 16C2.667 8.636 8.637 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.279-9.965c-.399-.2-2.36-1.164-2.727-1.297-.366-.133-.633-.2-.9.2-.266.399-1.032 1.297-1.265 1.563-.233.266-.466.3-.865.1-.399-.2-1.685-.62-3.21-1.98-1.187-1.058-1.988-2.364-2.222-2.763-.233-.4-.025-.615.175-.814.18-.179.4-.466.6-.699.2-.233.266-.4.4-.666.133-.266.066-.5-.034-.7-.1-.2-.9-2.163-1.232-2.962-.325-.78-.654-.675-.9-.687-.233-.011-.5-.014-.766-.014-.266 0-.7.1-1.066.5-.366.4-1.4 1.364-1.4 3.327s1.433 3.861 1.633 4.127c.2.267 2.82 4.307 6.832 6.036.955.412 1.7.658 2.282.842.959.305 1.832.262 2.522.159.769-.114 2.36-.965 2.693-1.897.333-.933.333-1.732.233-1.897-.1-.167-.366-.267-.765-.466z" />
      </svg>
    </a>
  );
}
