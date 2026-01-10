import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  Home, 
  ShoppingCart, 
  MapPin, 
  CreditCard, 
  User, 
  Menu, 
  X,
  Bell,
  MessageSquare,
  LogOut,
  Briefcase,
  Star,
  HelpCircle,
  Repeat,
  LayoutDashboard,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationProvider from '@/components/notifications/NotificationProvider';
import AskAI from '@/components/ai/AskAI';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const loadUnread = async () => {
      try {
        const user = await base44.auth.me();
        const notifications = await base44.entities.Notification.filter({
          user_email: user.email,
          is_read: false
        });
        setUnreadCount(notifications.length);
      } catch (error) {
        console.log('Error loading notifications');
      }
    };

    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link to={createPageUrl('Notifications')}>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          const userData = await base44.auth.me();
          setUser(userData);
          
          // Redirect to onboarding if not completed (only once)
          if (!userData.onboarding_completed && currentPageName !== 'Onboarding' && !hasCheckedOnboarding) {
            setHasCheckedOnboarding(true);
            window.location.href = '/#/Onboarding';
          }
        }
      } catch (error) {
        console.log('User not authenticated');
      }
    };
    loadUser();
  }, [currentPageName, hasCheckedOnboarding]);

  const adminNav = [
    { name: 'Dashboard', page: 'AdminDashboard', icon: LayoutDashboard },
    { name: 'Utilisateurs', page: 'AdminUsers', icon: Users },
    { name: 'Bringeurs', page: 'AdminIntervenants', icon: Star },
    { name: 'Missions', page: 'AdminMissions', icon: Briefcase },
    { name: 'Fidélité', page: 'AdminLoyalty', icon: Star },
    { name: 'Notifications', page: 'Notifications', icon: Bell },
  ];

  const clientNav = [
    { name: 'Accueil', page: 'Home', icon: Home },
    { name: 'Nouvelle Mission', page: 'NewMission', icon: ShoppingCart },
    { name: 'Mes Missions', page: 'ClientMissions', icon: Briefcase },
    { name: 'Récurrentes', page: 'RecurringMissions', icon: Repeat },
    { name: 'Carte', page: 'FindIntervenant', icon: MapPin },
    { name: 'Mes Cartes', page: 'StoreCards', icon: CreditCard },
    { name: 'Fidélité', page: 'LoyaltyPoints', icon: Star },
    { name: 'Factures', page: 'Invoices', icon: Briefcase },
    { name: 'Intervenants', page: 'IntervenantPreferences', icon: User },
    { name: 'Notifications', page: 'Notifications', icon: Bell },
  ];

  const intervenantNav = [
    { name: 'Dashboard', page: 'IntervenantDashboard', icon: Home },
    { name: 'Carte missions', page: 'MissionMap', icon: MapPin },
    { name: 'Tournée du jour', page: 'TourneeDuJour', icon: MapPin },
    { name: 'Missions Disponibles', page: 'AvailableMissions', icon: ShoppingCart },
    { name: 'Mes Missions', page: 'IntervenantMissions', icon: Briefcase },
    { name: 'Notifications', page: 'Notifications', icon: Bell },
  ];

  const navigation = user?.role === 'admin' ? adminNav : (user?.user_type === 'intervenant' ? intervenantNav : clientNav);

  const publicPages = ['Home', 'Login'];
  const isPublicPage = publicPages.includes(currentPageName);

  return (
    <NotificationProvider>
      {!isAuthenticated && !isPublicPage ? (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          {children}
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <style>{`
          :root {
            --primary: 160 84% 39%;
            --primary-foreground: 0 0% 100%;
          }
          .nav-link-active {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
          }
        `}</style>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                AskBring
              </span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && user && (
              <nav className="hidden md:flex items-center gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      currentPageName === item.page
                        ? 'nav-link-active shadow-lg shadow-emerald-500/20'
                        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  <NotificationBell />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 px-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profile_picture} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {user.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block text-sm font-medium text-gray-700">
                          {user.full_name}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {user.user_type === 'intervenant' ? 'Intervenant' : 'Client'}
                        </Badge>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Profile')} className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Mon Profil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Messages')} className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Messages
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => base44.auth.logout()}
                        className="text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Mobile menu button */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => base44.auth.redirectToLogin()}
                    className="text-gray-600"
                  >
                    Connexion
                  </Button>
                  <Button 
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
                  >
                    S'inscrire
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && isAuthenticated && user && (
          <div className="md:hidden border-t bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentPageName === item.page
                      ? 'nav-link-active'
                      : 'text-gray-600 hover:bg-emerald-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* AI Assistant */}
      {user && <AskAI user={user} />}

      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-700">AskBring</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('FAQ')} className="text-sm text-gray-600 hover:text-emerald-600 flex items-center gap-1">
                <HelpCircle className="w-4 h-4" />
                Aide & FAQ
              </Link>
              <span className="text-sm text-gray-500">
                © 2024 AskBring. Tous droits réservés.
              </span>
            </div>
          </div>
        </div>
      </footer>
        </div>
      )}
    </NotificationProvider>
  );
}