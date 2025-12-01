/**
 * 디자인 시스템 상수
 * smatch admin 스타일 가이드
 */

// 색상 팔레트
export const colors = {
  primary: '#FF9800', // 메인 주황색
  accent: '#FF5722', // 강조 주황-빨강
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  
  // 그레이 스케일
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // 텍스트
  text: {
    primary: '#212121',
    secondary: '#616161',
    disabled: '#9E9E9E',
    inverse: '#FFFFFF',
  },
  
  // 배경
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
    hover: '#F5F5F5',
  },
  
  // 보더
  border: {
    light: '#E0E0E0',
    default: '#BDBDBD',
    dark: '#616161',
  },
};

// 타이포그래피
export const typography = {
  h1: 'text-3xl font-bold text-gray-900',
  h2: 'text-2xl font-bold text-gray-900',
  h3: 'text-xl font-semibold text-gray-900',
  h4: 'text-lg font-semibold text-gray-900',
  h5: 'text-base font-semibold text-gray-900',
  h6: 'text-sm font-semibold text-gray-900',
  
  body1: 'text-base text-gray-700',
  body2: 'text-sm text-gray-700',
  
  caption: 'text-xs text-gray-500',
  overline: 'text-xs uppercase tracking-wider text-gray-500',
  
  label: 'text-sm font-medium text-gray-700',
};

// 스페이싱
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

// 브레이크포인트
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// 그림자
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

// 전환 효과
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// 보더 반경
export const borderRadius = {
  sm: '0.25rem',   // 4px
  DEFAULT: '0.375rem', // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
};






