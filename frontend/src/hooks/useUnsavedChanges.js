import { useEffect, useState, useCallback } from 'react';

export function useUnsavedChanges(initialState) {
  const [hasChanges, setHasChanges] = useState(false);
  const [savedState, setSavedState] = useState(initialState);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const markAsChanged = useCallback(() => setHasChanges(true), []);
  const markAsSaved = useCallback((newState) => {
    setHasChanges(false);
    if (newState !== undefined) setSavedState(newState);
  }, []);

  return { hasChanges, markAsChanged, markAsSaved, savedState };
}
