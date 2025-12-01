import PropTypes from 'prop-types';

/**
 * Button 컴포넌트
 * smatch admin 스타일
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  loading = false,
  className = '',
}) => {
  // Variant 스타일
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white border-transparent shadow-sm',
    accent: 'bg-accent-500 hover:bg-accent-600 text-white border-transparent shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-transparent',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
    danger: 'bg-red-500 hover:bg-red-600 text-white border-transparent shadow-sm',
    success: 'bg-green-500 hover:bg-green-600 text-white border-transparent shadow-sm',
  };

  // Size 스타일
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  // Disabled 스타일
  const disabledClasses = disabled || loading
    ? 'opacity-50 cursor-not-allowed'
    : 'transition-all duration-200';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-button border
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'accent', 'secondary', 'outline', 'ghost', 'danger', 'success']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;






