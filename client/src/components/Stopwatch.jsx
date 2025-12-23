import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
} from 'react';

const Stopwatch = forwardRef(function Stopwatch({ running, resetSignal }, ref) {
  const startTimeRef = useRef(0);
  const rafRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  useImperativeHandle(
    ref,
    () => ({
      getCurrentTime: () => {
        console.log('elapsed: ' + elapsed);
        return elapsed;
      },
    }),
    [elapsed]
  );

  useEffect(() => {
    setElapsed(0);
    startTimeRef.current = performance.now();
  }, [resetSignal]);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = performance.now() - elapsed;

    const tick = () => {
      setElapsed(performance.now() - startTimeRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;
  const milliseconds = Math.floor((elapsed % 1000) / 10);

  return (
    <div>
      {minutes}:{displaySeconds.toString().padStart(2, '0')}.
      {milliseconds.toString().padStart(1, '0')}
    </div>
  );
});

export default Stopwatch;
