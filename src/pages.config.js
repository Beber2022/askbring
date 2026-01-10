import AvailableMissions from './pages/AvailableMissions';
import ClientMissions from './pages/ClientMissions';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import IntervenantDashboard from './pages/IntervenantDashboard';
import IntervenantMissions from './pages/IntervenantMissions';
import LoyaltyPoints from './pages/LoyaltyPoints';
import Messages from './pages/Messages';
import MissionDetails from './pages/MissionDetails';
import NewMission from './pages/NewMission';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import RateMission from './pages/RateMission';
import StoreCards from './pages/StoreCards';
import TrackMission from './pages/TrackMission';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AvailableMissions": AvailableMissions,
    "ClientMissions": ClientMissions,
    "FAQ": FAQ,
    "Home": Home,
    "IntervenantDashboard": IntervenantDashboard,
    "IntervenantMissions": IntervenantMissions,
    "LoyaltyPoints": LoyaltyPoints,
    "Messages": Messages,
    "MissionDetails": MissionDetails,
    "NewMission": NewMission,
    "Notifications": Notifications,
    "Profile": Profile,
    "RateMission": RateMission,
    "StoreCards": StoreCards,
    "TrackMission": TrackMission,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};