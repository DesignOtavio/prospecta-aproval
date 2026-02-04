import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="layout text-slate-900">
            <Sidebar />
            <div className="layout__content">
                <Header />
                <main className="layout__main">
                    {children}
                </main>
                <BottomNav />
            </div>
        </div>
    );
};

export default Layout;
