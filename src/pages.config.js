import Home from './pages/Home';
import Profile from './pages/Profile';
import NewMission from './pages/NewMission';
import StoreCards from './pages/StoreCards';
import ClientMissions from './pages/ClientMissions';
import IntervenantDashboard from './pages/IntervenantDashboard';
import AvailableMissions from './pages/AvailableMissions';
import IntervenantMissions from './pages/IntervenantMissions';
import MissionDetails from './pages/MissionDetails';
import TrackMission from './pages/TrackMission';
import Messages from './pages/Messages';
import RateMission from './pages/RateMission';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Profile": Profile,
    "NewMission": NewMission,
    "StoreCards": StoreCards,
    "ClientMissions": ClientMissions,
    "IntervenantDashboard": IntervenantDashboard,
    "AvailableMissions": AvailableMissions,
    "IntervenantMissions": IntervenantMissions,
    "MissionDetails": MissionDetails,
    "TrackMission": TrackMission,
    "Messages": Messages,
    "RateMission": RateMission,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};