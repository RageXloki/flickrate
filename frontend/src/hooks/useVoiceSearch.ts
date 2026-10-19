import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceSearchState = "idle" | "listening" | "processing" | "result" | "unsupported";

interface SpeechRecognitionResultLike {
  transcript: string;
}

// Minimal shape of the Web Speech API's SpeechRecognition we rely on;
// browsers expose it as `SpeechRecognition` or the vendor-prefixed
// `webkitSpeechRecognition`, and TypeScript's DOM lib doesn't include it.
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => SpeechRecognitionLike) | null;
}

export function useVoiceSearch(onResult: (transcript: string) => void) {
  const [state, setState] = useState<VoiceSearchState>("idle");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!getSpeechRecognitionCtor()) {
      setState("unsupported");
    }
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setState("unsupported");
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      setState("processing");
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      onResult(transcript);
      setState("result");
    };
    recognition.onerror = () => setState("idle");
    recognition.onend = () => {
      setState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognitionRef.current = recognition;
    setState("listening");
    recognition.start();
  }, [onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setState("idle");
  }, []);

  return { state, start, stop, isSupported: state !== "unsupported" };
}
