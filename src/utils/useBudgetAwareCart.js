import { useCart } from '../context/CartContext';
import { useBudget } from '../context/BudgetContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from './currency';

export function useBudgetAwareCart() {
  const cart = useCart();
  const { budget, budgetActive } = useBudget();
  const { notify } = useToast();

  // `quiet`: skip the "Added to your plan" toast — used by the + on a
  // quantity stepper, where the number changing is feedback enough. The
  // budget check still applies.
  const addWithinBudget = (venue, item, kind = 'menu', { quiet = false } = {}) => {
    if (budgetActive && budget != null) {
      const projected = cart.totalPrice + item.price;
      if (projected > budget) {
        notify(
          `Adding "${item.name}" would put you ${formatNaira(projected - budget)} over your ${formatNaira(
            budget,
          )} budget.`,
          'warning',
          4500,
        );
        return false;
      }
    }
    cart.addItem(venue, item, kind);
    if (!quiet) notify(`Added "${item.name}" to your plan.`, 'success');
    return true;
  };

  return { ...cart, addWithinBudget, budget, budgetActive };
}
