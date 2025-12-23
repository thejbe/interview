"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, headerAction }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden"; // Prevent background scrolling
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Use createPortal to render at the root level, avoiding z-index issues
    // Note: Ensure your layout has a div with id="modal-root" or just render in body if preferred (Next.js usually handles body fine)
    // For simplicity in this stack, we'll render directly but fixed positioning usually works fine without portal if z-index is high enough.
    // However, Portal is best practice. Let's try direct first for simplicity, or Portal if document exists.

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            ref={overlayRef}
            onClick={(e) => e.target === overlayRef.current && onClose()}
        >
            <div className="bg-[#152211] border border-[#2c4823] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
                <div className="sticky top-0 z-10 bg-[#152211] border-b border-[#2c4823] p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <div className="flex items-center gap-3">
                        {headerAction}
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
