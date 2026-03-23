import { useState, useCallback } from 'react';

interface ConfirmConfig {
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmState extends ConfirmConfig {
  isOpen: boolean;
  onConfirm: () => void;
}

/**
 * Hook to manage ConfirmModal state declaratively.
 * Replaces all window.confirm() calls with a consistent modal UX.
 *
 * Usage:
 * ```
 * const { confirmState, confirm } = useConfirmModal();
 * confirm({ title: '...', message: '...' }, async () => { ... });
 * <ConfirmModal {...confirmState} onClose={() => closeConfirm()} />
 * ```
 */
export const useConfirmModal = () => {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {},
  });

  const confirm = useCallback((config: ConfirmConfig, onConfirm: () => void | Promise<void>) => {
    setConfirmState({
      isOpen: true,
      ...config,
      onConfirm: async () => {
        await onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return { confirmState, confirm, closeConfirm };
};
