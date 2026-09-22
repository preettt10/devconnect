// src/components/ui/Spinner.jsx
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border',
    md: 'w-7 h-7 border-2',
    lg: 'w-12 h-12 border-2',
  };

  return (
    <div
      className={`${sizes[size]} border-indigo-500 border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
};

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-[var(--color-text-muted)] text-sm">Loading...</p>
    </div>
  </div>
);

export default Spinner;
