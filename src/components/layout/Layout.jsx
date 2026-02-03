import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <Sidebar />
            <div className="layout__content">
                <Header />
                <main className="layout__main">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
