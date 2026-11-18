/** WhatsApp glyph (lucide has no brand icons): outlined chat bubble with a handset. Uses currentColor. */
export function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3.5 20.5 4.8 16.7A8.5 8.5 0 1 1 8 19.6Z" />
      <path d="M9.1 8.6c.2-.5.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.1.7l-.5.6c-.1.2-.1.4 0 .6.5.9 1.3 1.7 2.3 2.2.2.1.4.1.6-.1l.6-.6c.2-.2.4-.2.7-.1l1.5.7c.3.1.4.3.4.6v.4c0 .4-.2.8-.6 1-.5.3-1.2.5-1.9.3-2.6-.7-4.6-2.6-5.5-5.1-.2-.7 0-1.4.4-2.2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
