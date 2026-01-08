import Home from './pages/Home';
import Profile from './pages/Profile';
import NewMission from './pages/NewMission';
import StoreCards from './pages/StoreCards';
import ClientMissions from './pages/ClientMissions';
import IntervenantDashboard from './pages/IntervenantDashboard';
import AvailableMissions from './pages/AvailableMissions';
import IntervenantMissions from './pages/IntervenantMissions';
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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};