// src/components/layout/AppLayout.jsx
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';

const AppLayout = ({ children, sidebar = true }) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`flex gap-8 ${sidebar ? '' : 'justify-center'}`}>
          {sidebar && <Sidebar />}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
