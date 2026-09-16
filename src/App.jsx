import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { SavedPlansProvider } from './context/SavedPlansContext';
import { BudgetProvider } from './context/BudgetContext';
import { ToastProvider } from './context/ToastContext';
import { ReviewsProvider } from './context/ReviewsContext';
import { ThemeProvider } from './context/ThemeContext';

import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Details from './pages/Details';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Notifications from './pages/Notifications';
import PlanOuting from './pages/PlanOuting';
import BallPlanPlan from './pages/BallPlanPlan';
import PlanResult from './pages/PlanResult';
import PlanYourself from './pages/PlanYourself';
import ViewPlan from './pages/ViewPlan';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Waitlist from './pages/Waitlist';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <SavedPlansProvider>
            <BudgetProvider>
              <CartProvider>
                <ToastProvider>
                  <ReviewsProvider>
                    <BrowserRouter>
                      <Routes>
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/verify" element={<Verify />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/waitlist" element={<Waitlist />} />

                        <Route element={<Layout />}>
                          <Route path="/" element={<Home />} />
                          <Route path="/search" element={<Search />} />
                          <Route path="/details/:id" element={<Details />} />
                          <Route path="/my-plan" element={<Cart />} />
                          <Route path="/favorites" element={<Favorites />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/plan-outing" element={<PlanOuting />} />
                          <Route path="/plan-outing/ballplan" element={<BallPlanPlan />} />
                          <Route path="/plan-outing/result" element={<PlanResult />} />
                          <Route path="/plan-outing/yourself" element={<PlanYourself />} />
                          <Route path="/view-plan" element={<ViewPlan />} />
                          <Route path="*" element={<Home />} />
                        </Route>
                      </Routes>
                    </BrowserRouter>
                  </ReviewsProvider>
                </ToastProvider>
              </CartProvider>
            </BudgetProvider>
          </SavedPlansProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
