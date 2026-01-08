import Home from './pages/Home';
import Profile from './pages/Profile';
import NewMission from './pages/NewMission';
import StoreCards from './pages/StoreCards';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Profile": Profile,
    "NewMission": NewMission,
    "StoreCards": StoreCards,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};