import { useKeycloak } from '@react-keycloak/web';
import { Link } from 'react-router-dom';
import { FaSearch, FaShoppingCart } from 'react-icons/fa';
import logoMobile from '../../images/mobile-logo-white.png';
import logoDesktop from '../../images/logo-white.png';

export const Navbar = ({ totalQuantity }) => {
  const { keycloak } = useKeycloak();
  const username = keycloak.authenticated ? keycloak.tokenParsed?.preferred_username : '';

  const handleLogout = () => {
    keycloak.logout({ redirectUri: window.location.origin + '/' });
  };

  return (
    <nav className="flex items-center justify-between bg-gradient-to-r from-blue-400 to-red-300 h-20 px-4 sm:px-6 shadow-md">
      
      {/* Logo */}
      <Link to="/home" className="flex items-center">
        <img src={logoMobile} alt="Logo Mobile" className="h-10 w-auto lg:hidden" />
        <img src={logoDesktop} alt="Logo Desktop" className="hidden lg:block h-12 w-auto" />
      </Link>

      {/* Search */}
      <div className="flex items-center flex-2 mx-4 sm:mx-6 max-w-full sm:max-w-lg">
        <input
          type="text"
          placeholder="Search products..."
          className="flex-1 bg-white h-9 px-3 sm:px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-300 text-sm sm:text-base"
        />
        <button className="bg-blue-500 border border-gray-300 h-9 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-r-md">
          <FaSearch />
        </button>
      </div>

      {/* Cart */}
      <Link to="/checkout" className="relative flex w-20 items-center cursor-pointer px-2 py-2 border hover:border-gray-300">
        <FaShoppingCart size={24} />
        <span className="font-semibold ml-1">Cart</span>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {totalQuantity}
        </span>
      </Link>

      {/* User info */}
      {keycloak.authenticated && (
        <div className="flex items-center justify-center ml-5 px-4 min-w-[80px] h-8 font-bold cursor-pointer rounded-xl bg-gray-300 " onClick={handleLogout}>
          <h2>{username}</h2>
        </div>
      )}
    </nav>
  );
};