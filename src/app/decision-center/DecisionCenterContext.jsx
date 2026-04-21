import { createContext, useContext, useMemo, useState } from "react";

const DecisionCenterContext = createContext(null);

export function DecisionCenterProvider({ children }) {
  const [entriesBySection, setEntriesBySection] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      entriesBySection,
      isOpen,
      openDecisionCenter() {
        setIsOpen(true);
      },
      closeDecisionCenter() {
        setIsOpen(false);
      },
      publishSectionInsights(sectionId, payload) {
        setEntriesBySection((current) => ({
          ...current,
          [sectionId]: payload,
        }));
      },
      clearSectionInsights(sectionId) {
        setEntriesBySection((current) => {
          if (!current[sectionId]) {
            return current;
          }

          const next = { ...current };
          delete next[sectionId];
          return next;
        });
      },
    }),
    [entriesBySection, isOpen]
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
