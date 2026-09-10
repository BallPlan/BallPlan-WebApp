import { createContext, useContext } from 'react';
import { useLocalStorage } from '../utils/useLocalStorage';

const BudgetContext = createContext(null);

export function BudgetProvider({ children }) {
  const [budget, setBudget] = useLocalStorage('ballplan_budget', null);
  const [budgetActive, setBudgetActive] = useLocalStorage('ballplan_budget_active', false);

  const startBudget = (amount) => {
    setBudget(amount);
    setBudgetActive(true);
  };

  const clearBudget = () => {
    setBudget(null);
    setBudgetActive(false);
  };

  return (
    <BudgetContext.Provider value={{ budget, budgetActive, startBudget, clearBudget }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}
