import AvailableMissions from './pages/AvailableMissions';
import ClientMissions from './pages/ClientMissions';
import FAQ from './pages/FAQ';
import FindIntervenant from './pages/FindIntervenant';
import Home from './pages/Home';
import IntervenantDashboard from './pages/IntervenantDashboard';
import IntervenantMissions from './pages/IntervenantMissions';
import IntervenantPreferences from './pages/IntervenantPreferences';
import LoyaltyPoints from './pages/LoyaltyPoints';
import Messages from './pages/Messages';
import MissionDetails from './pages/MissionDetails';
import NewMission from './pages/NewMission';
import Notifications from './pages/Notifications';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import RateClient from './pages/RateClient';
import RateMission from './pages/RateMission';
import StoreCards from './pages/StoreCards';
import TourneeDuJour from './pages/TourneeDuJour';
import TrackMission from './pages/TrackMission';
import RecurringMissions from './pages/RecurringMissions';
import CreateRecurringMission from './pages/CreateRecurringMission';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminMissions from './pages/AdminMissions';
import MissionMap from './pages/MissionMap';
import AdminIntervenants from './pages/AdminIntervenants';
import Register from './pages/Register';
import AdminLoyalty from './pages/AdminLoyalty';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AvailableMissions": AvailableMissions,
    "ClientMissions": ClientMissions,
    "FAQ": FAQ,
    "FindIntervenant": FindIntervenant,
    "Home": Home,
    "IntervenantDashboard": IntervenantDashboard,
    "IntervenantMissions": IntervenantMissions,
    "IntervenantPreferences": IntervenantPreferences,
    "LoyaltyPoints": LoyaltyPoints,
    "Messages": Messages,
    "MissionDetails": MissionDetails,
    "NewMission": NewMission,
    "Notifications": Notifications,
    "Onboarding": Onboarding,
    "Profile": Profile,
    "RateClient": RateClient,
    "RateMission": RateMission,
    "StoreCards": StoreCards,
    "TourneeDuJour": TourneeDuJour,
    "TrackMission": TrackMission,
    "RecurringMissions": RecurringMissions,
    "CreateRecurringMission": CreateRecurringMission,
    "AdminDashboard": AdminDashboard,
    "AdminUsers": AdminUsers,
    "AdminMissions": AdminMissions,
    "MissionMap": MissionMap,
    "AdminIntervenants": AdminIntervenants,
    "Register": Register,
    "AdminLoyalty": AdminLoyalty,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};