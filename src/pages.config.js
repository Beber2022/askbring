import AdminDashboard from './pages/AdminDashboard';
import AdminIntervenants from './pages/AdminIntervenants';
import AdminLoyalty from './pages/AdminLoyalty';
import AdminMissions from './pages/AdminMissions';
import AdminUsers from './pages/AdminUsers';
import AvailableMissions from './pages/AvailableMissions';
import ClientMissions from './pages/ClientMissions';
import CreateRecurringMission from './pages/CreateRecurringMission';
import FAQ from './pages/FAQ';
import FindIntervenant from './pages/FindIntervenant';
import Home from './pages/Home';
import IntervenantDashboard from './pages/IntervenantDashboard';
import IntervenantMissions from './pages/IntervenantMissions';
import IntervenantPreferences from './pages/IntervenantPreferences';
import LoyaltyPoints from './pages/LoyaltyPoints';
import Messages from './pages/Messages';
import MissionDetails from './pages/MissionDetails';
import MissionMap from './pages/MissionMap';
import NewMission from './pages/NewMission';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import RateClient from './pages/RateClient';
import RateMission from './pages/RateMission';
import RecurringMissions from './pages/RecurringMissions';
import Register from './pages/Register';
import StoreCards from './pages/StoreCards';
import TourneeDuJour from './pages/TourneeDuJour';
import TrackMission from './pages/TrackMission';
import Invoices from './pages/Invoices';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminIntervenants": AdminIntervenants,
    "AdminLoyalty": AdminLoyalty,
    "AdminMissions": AdminMissions,
    "AdminUsers": AdminUsers,
    "AvailableMissions": AvailableMissions,
    "ClientMissions": ClientMissions,
    "CreateRecurringMission": CreateRecurringMission,
    "FAQ": FAQ,
    "FindIntervenant": FindIntervenant,
    "Home": Home,
    "IntervenantDashboard": IntervenantDashboard,
    "IntervenantMissions": IntervenantMissions,
    "IntervenantPreferences": IntervenantPreferences,
    "LoyaltyPoints": LoyaltyPoints,
    "Messages": Messages,
    "MissionDetails": MissionDetails,
    "MissionMap": MissionMap,
    "NewMission": NewMission,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Profile": Profile,
    "RateClient": RateClient,
    "RateMission": RateMission,
    "RecurringMissions": RecurringMissions,
    "Register": Register,
    "StoreCards": StoreCards,
    "TourneeDuJour": TourneeDuJour,
    "TrackMission": TrackMission,
    "Invoices": Invoices,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};