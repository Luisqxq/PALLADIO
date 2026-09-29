// Evita que el teclado tape el campo en el que escribes (pendiente #3).
// Android dibuja la app "de borde a borde", así que la ventana no se achica
// cuando aparece el teclado: aquí se agrega espacio al final del contenido y
// se desplaza la pantalla hasta dejar el campo a la vista.

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  type ReactNode, type RefObject,
} from 'react';
import { Keyboard, ScrollView, TextInput, View, type ScrollViewProps, type TextInputProps } from 'react-native';

type Ctx = { reveal: (node: TextInput | null) => void; scrollRef: RefObject<ScrollView | null> };
const KeyboardCtx = createContext<Ctx>({ reveal: () => {}, scrollRef: { current: null } });

export function useScrollToTop() {
  const { scrollRef } = useContext(KeyboardCtx);
  return useCallback(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), [scrollRef]);
}

export function KeyboardScrollView({ children, ...props }: ScrollViewProps & { children: ReactNode }) {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const reveal = useCallback((node: TextInput | null) => {
    // Se espera a que el teclado termine de abrir antes de medir.
    setTimeout(() => {
      const content = contentRef.current;
      if (!node || !content) return;
      node.measureLayout(
        content,
        (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 140), animated: true }),
        () => {},
      );
    }, 300);
  }, []);

  return (
    <KeyboardCtx.Provider value={{ reveal, scrollRef }}>
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" {...props}>
        <View ref={contentRef} style={{ paddingBottom: keyboardHeight }}>
          {children}
        </View>
      </ScrollView>
    </KeyboardCtx.Provider>
  );
}

export function Input(props: TextInputProps) {
  const { reveal } = useContext(KeyboardCtx);
  const ref = useRef<TextInput>(null);
  return (
    <TextInput
      ref={ref}
      {...props}
      onFocus={(e) => {
        props.onFocus?.(e);
        reveal(ref.current);
      }}
    />
  );
}
