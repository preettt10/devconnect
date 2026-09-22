// src/components/ui/Avatar.jsx
const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-2xl',
};

const Avatar = ({ src, alt, name = '?', size = 'md', className = '', online = false }) => {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`avatar ${sizeClasses[size]}`}
        />
      ) : (
        <div
          className={`avatar ${sizeClasses[size]} bg-gradient-to-br from-indigo-500 to-purple-600 
                      flex items-center justify-center font-semibold text-white`}
          title={name}
        >
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 online-dot" title="Online" />
      )}
    </div>
  );
};

export default Avatar;
