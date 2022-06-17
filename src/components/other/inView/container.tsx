import { useEffect, useState, useRef } from 'preact/hooks';

const isElementVisible = (element: HTMLElement, container: HTMLElement) => {
  if (!element || !container) {
    return false;
  }
  const { bottom, height, top } = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  return top <= containerRect.top ? containerRect.top - top <= height : bottom - containerRect.bottom <= height;
};

const useInView = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const contRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (ref.current !== null && contRef.current !== null) {
      setIsInView(isElementVisible(ref.current, contRef.current));
    }
    const onScroll = () => {
      if (ref.current && contRef.current) {
        setIsInView(isElementVisible(ref.current, contRef.current));
      }
    };
    if(contRef.current) contRef.current.addEventListener('scroll', onScroll);

    return () => contRef.current ? contRef.current.removeEventListener('scroll', onScroll) : null;
  }, [ref.current, contRef.current]);

  const inViewRef = (node: HTMLDivElement | null) => {
    ref.current = node;
  };

  const containerRef = (node: HTMLDivElement | null) => {
    contRef.current = node;
  }

  return { isInView, inViewRef, containerRef };
};

export default useInView;