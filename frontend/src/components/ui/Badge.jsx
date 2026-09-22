// src/components/ui/Badge.jsx
const variants = {
  brand: 'badge-brand',
  accent: 'badge-accent',
  muted: 'badge-muted',
  red: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const Badge = ({ children, variant = 'muted', className = '', onClick }) => {
  return (
    <span
      className={`badge ${variants[variant]} ${className} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
};

export default Badge;
