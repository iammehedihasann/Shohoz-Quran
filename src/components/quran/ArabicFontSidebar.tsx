import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import ArabicFontSelector from "./ArabicFontSelector";

export default function ArabicFontSidebar({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger = document.activeElement;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="arabic-font-sidebar"
      aria-labelledby="arabic-font-sidebar-title"
      onCancel={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
        }
      }}
    >
      <header>
        <h2 id="arabic-font-sidebar-title">Arabic Font</h2>
        <button type="button" className="icon-button" aria-label="Close Arabic font settings" onClick={onClose}><X size={20} /></button>
      </header>
      <ArabicFontSelector id="reader-arabic-font" />
    </dialog>
  );
}
