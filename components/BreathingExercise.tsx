import React, { useState, useEffect } from 'react';

interface BreathingExerciseProps {
  onClose: () => void;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onClose }) => {
  const [instruction, setInstruction] = useState('Prepare-se...');
  const [scaleClass, setScaleClass] = useState('scale-50'); // Start small

  // Effect for the 1-minute timer to auto-close
  useEffect(() => {
    const timerId = setTimeout(() => {
      onClose();
    }, 60000); // 60 seconds

    return () => {
      clearTimeout(timerId); // Clean up the timer
    };
  }, [onClose]);

  // Effect for the breathing cycle animation
  useEffect(() => {
    const cycle = [
      { text: 'Inspire lentamente...', duration: 4000, scale: 'scale-100' },
      { text: 'Segure a respiração', duration: 4000, scale: 'scale-100' },
      { text: 'Expire suavemente...', duration: 4000, scale: 'scale-50' },
      { text: 'Pausa', duration: 4000, scale: 'scale-50' },
    ];
    let currentIndex = -1;
    let timeoutId: number;

    const nextStep = () => {
      currentIndex = (currentIndex + 1) % cycle.length;
      const { text, duration, scale } = cycle[currentIndex];
      setInstruction(text);
      setScaleClass(scale);
      timeoutId = window.setTimeout(nextStep, duration);
    };

    const startTimeout = setTimeout(nextStep, 1500); // Initial delay to allow user to get ready

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-sky-900/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="breathing-exercise-title"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
        aria-label="Fechar exercício de respiração"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        {/* We use Tailwind's JIT compiler feature by specifying arbitrary values like `delay-[75ms]` or `duration-[4000ms]`. These will be generated on the fly. */}
        <div className={`absolute w-full h-full bg-sky-300/20 rounded-full transition-transform duration-[4000ms] ease-in-out ${scaleClass}`}></div>
        <div className={`absolute w-3/4 h-3/4 bg-sky-400/30 rounded-full transition-transform duration-[4000ms] ease-in-out delay-75 ${scaleClass}`}></div>
        <div className={`absolute w-1/2 h-1/2 bg-sky-500/40 rounded-full transition-transform duration-[4000ms] ease-in-out delay-150 ${scaleClass}`}></div>
      </div>
      
      <h2 id="breathing-exercise-title" className="text-2xl md:text-3xl font-medium text-white mt-12 text-center transition-opacity duration-500">
        {instruction}
      </h2>
      <p className="text-white/80 mt-2 text-center">Sincronize a sua respiração com o círculo.<br/>O exercício terminará automaticamente em 1 minuto.</p>
    </div>
  );
};

export default BreathingExercise;