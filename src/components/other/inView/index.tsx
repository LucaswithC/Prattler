import { useEffect, useState, useRef } from 'preact/hooks';

const isElementVisible = (element: HTMLElement) => {
  if (!element) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  const width = window.innerWidth || document.documentElement.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight;

  return !(rect.right < 0 || rect.bottom < 0 || rect.left > width || rect.top > height + 20);
};

const useInView = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (ref.current !== null) {
      setIsInView(isElementVisible(ref.current));
    }
    const onScroll = () => {
      if (ref.current) {
        setIsInView(isElementVisible(ref.current));
      }
    };
    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  }, [ref.current]);

  const inViewRef = (node: HTMLDivElement | null) => {
    ref.current = node;
  };

  return { isInView, inViewRef };
};

export default useInView;