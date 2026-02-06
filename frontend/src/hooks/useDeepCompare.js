import { useRef } from 'react';

/**
 * 객체/배열의 깊은 비교를 수행하여 실제 값이 변경되었을 때만 새 참조를 반환합니다.
 * useEffect 의존성에서 JSON.stringify 사용을 대체합니다.
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqual(a[key], b[key]));
  }

  return false;
}

/**
 * 값이 실제로 변경된 경우에만 새 참조를 반환합니다.
 * useEffect의 의존성 배열에서 JSON.stringify를 대체합니다.
 */
export function useDeepCompareMemo(value) {
  const ref = useRef(value);

  if (!deepEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}
