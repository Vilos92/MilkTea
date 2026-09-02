import {useCallback, useRef} from 'preact/hooks';

/**
 * Mints monotonic start tokens from one counter, so several native capture sources sharing the
 * single backend session can be ordered by dispatch. The backend installs the highest token, which
 * lets the newest source choice win when starts contend.
 *
 * The counter resets with the component, matching the backend's reset on reload and unmount.
 */
export function useNativeStartToken(): () => number {
  const tokenRef = useRef(0);

  return useCallback(() => {
    tokenRef.current += 1;
    return tokenRef.current;
  }, []);
}
