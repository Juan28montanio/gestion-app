import { createContext, useCallback, useContext, useMemo, useState } from "react";

const DecisionCenterContext = createContext(null);

export function DecisionCenterProvider({ children }) {
  const [entriesBySection, setEntriesBySection] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  const openDecisionCenter = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDecisionCenter = useCallback(() => {
    setIsOpen(false);
  }, []);

  const publishSectionInsights = useCallback((sectionId, payload) => {
    setEntriesBySection((current) => ({
      ...current,
      [sectionId]: payload,
    }));
  }, []);

  const clearSectionInsights = useCallback((sectionId) => {
    setEntriesBySection((current) => {
      if (!current[sectionId]) {
        return current;
      }

      const next = { ...current };
      delete next[sectionId];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      entriesBySection,
      isOpen,
      openDecisionCenter,
      closeDecisionCenter,
      publishSectionInsights,
      clearSectionInsights,
    }),
    [
      clearSectionInsights,
      closeDecisionCenter,
      entriesBySection,
      isOpen,
      openDecisionCenter,
      publishSectionInsights,
    ]
  );

  return <DecisionCenterContext.Provider value={value}>{children}</DecisionCenterContext.Provider>;
}

export function useDecisionCenter() {
  const context = useContext(DecisionCenterContext);

  if (!context) {
    throw new Error("useDecisionCenter debe usarse dentro de DecisionCenterProvider.");
  }

  return context;
}
