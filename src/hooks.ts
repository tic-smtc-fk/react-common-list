import { useEffect, useRef, EffectCallback, DependencyList } from 'react';

export function useDidMount(fn: EffectCallback) {
  useEffect(fn, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useDidUpdate(fn: EffectCallback, deps?: DependencyList) {
  const ref = useRef(false);

  useEffect(() => {
    if (!ref.current) {
      ref.current = true;
    } else {
      fn();
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
