const SmokeBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 arena-gradient" />
      
      {/* Animated smoke layers */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-smoke"
          style={{ animationDelay: '0s' }}
        />
        <div 
          className="absolute top-1/2 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl animate-smoke"
          style={{ animationDelay: '2s' }}
        />
        <div 
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-primary/4 rounded-full blur-3xl animate-smoke"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Vignette effect */}
      <div className="absolute inset-0 smoke-overlay" />

      {/* Subtle red glow from bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/10 to-transparent" />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent" />
    </div>
  );
};

export default SmokeBackground;
