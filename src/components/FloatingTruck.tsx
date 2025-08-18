import { motion } from "framer-motion";

export const FloatingTruck = ({ onClick, style }: { onClick: () => void; style?: React.CSSProperties }) => (
  <motion.div
    drag
    dragMomentum={false}
    dragElastic={0.2}
    initial={{ y: 0, x: 0 }}
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.95 }}
    style={{
      position: "fixed",
      bottom: 32,
      right: 32,
      zIndex: 100,
      cursor: "pointer",
      ...style,
    }}
    aria-label="Open chatbot"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={e => (e.key === "Enter" || e.key === " ") && onClick()}
  >
    {/* SVG truck icon, styled for fun */}
    <svg width="56" height="36" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="14" width="28" height="14" rx="4" fill="#23232a" stroke="#3b82f6" strokeWidth="2" />
      <rect x="30" y="20" width="18" height="8" rx="2" fill="#06b6d4" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="12" cy="32" r="4" fill="#a78bfa" stroke="#fff" strokeWidth="2" />
      <circle cx="44" cy="32" r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
      <rect x="36" y="14" width="8" height="6" rx="1" fill="#fff" fillOpacity="0.7" />
      <rect x="6" y="18" width="8" height="4" rx="1" fill="#fff" fillOpacity="0.2" />
    </svg>
  </motion.div>
);
