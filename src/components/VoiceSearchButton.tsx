import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;
  onSearchSubmit?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onTranscript,
  onSearchSubmit,
  className = '',
  size = 'md'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('خاصية البحث الصوتي غير مدعومة في هذا المتصفح. يرجى استخدام Google Chrome أو Edge.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG'; // Egyptian Arabic
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const transcript = finalTranscript || interimTranscript;
        if (transcript.trim()) {
          onTranscript(transcript.trim());
        }

        if (finalTranscript && onSearchSubmit) {
          setTimeout(() => {
            onSearchSubmit();
          }, 300);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('يرجى السماح بصلاحية الميكروفون في المتصفح 🎙️');
        } else if (event.error === 'no-speech') {
          setErrorMessage('لم يتم سماع صوت، حاول مرة أخرى.');
        } else {
          setErrorMessage('حدث خطأ أثناء الاستماع، يرجى المحاولة ثانية.');
        }
        setIsListening(false);
        setTimeout(() => setErrorMessage(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
      setErrorMessage('تعذر بدء الميكروفون، يرجى إعادة المحاولة.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-5 h-5'
  };

  const buttonPaddings = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        title={
          isListening
            ? 'جاري الاستماع... اضغط للإيقاف'
            : isSupported
            ? 'بحث صوتي: اضغط وتحدث باسم الدواء'
            : 'البحث الصوتي غير مدعوم في متصفحك'
        }
        className={`relative flex items-center justify-center rounded-xl transition-all cursor-pointer select-none ${
          buttonPaddings[size]
        } ${
          isListening
            ? 'bg-rose-500 text-white shadow-lg ring-4 ring-rose-200 animate-pulse'
            : 'text-gray-400 hover:text-[#0755b8] hover:bg-blue-50 active:scale-95'
        } ${className}`}
      >
        {isListening ? (
          <>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <Mic className={`${iconSizes[size]} animate-bounce`} />
          </>
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>

      {/* Floating Status / Error Tooltip */}
      {isListening && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap bg-[#102a43] text-white text-xs px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 border border-blue-800 animate-in fade-in slide-in-from-bottom-1 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="font-bold">تحدث الآن... جاري الاستماع 🎙️</span>
        </div>
      )}

      {errorMessage && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 whitespace-nowrap bg-rose-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 border border-rose-700 animate-in fade-in slide-in-from-top-1 pointer-events-none">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
