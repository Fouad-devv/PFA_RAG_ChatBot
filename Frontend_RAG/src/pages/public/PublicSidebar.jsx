// PublicSidebar.jsx
import { useKeycloak } from "@react-keycloak/web";

export const PublicSidebar = ({ sidebarOpen, setSidebarOpen, openSpaceUser, setOpenSpaceUser }) => {
  const { keycloak } = useKeycloak();
  const username = "Guest User";
  const email = "No email";

  const handleLogin = () => {
    keycloak.login({ redirectUri: window.location.origin + "/home" });
  };


  return (
    <div
      className={`fixed z-50 flex flex-col w-65 lg:w-72 bg-gradient-to-b from-green-900 to-gray-900 text-white h-screen border-r-3 border-gray-400 transition-transform transform
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:flex`}
    >
      {/* Header */}
      <header className="p-4 h-19 flex justify-between items-center border-b border-green-700">
        <span className="font-bold text-lg text-gray-200">Public Chat</span>

        <div className="flex items-center gap-2">
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white text-xl lg:hidden"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-4">
        <div className="bg-white/10 rounded-lg p-4 text-gray-200">
          <p className="font-semibold mb-2">Hello, {username}!</p>
          <p className="text-sm">
            You are currently in public chat mode. Messages are <span className="font-bold">not saved</span> and no history is available.
          </p>
        </div>

        <div className="bg-white/10 rounded-lg p-4 text-gray-200">
          <p className="font-semibold mb-2">Sign in to unlock features:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Save chat history</li>
            <li>Access previous conversations</li>
          </ul>
        </div>

        <button className="w-full bg-gradient-to-r from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200" onClick={handleLogin}>Sign in</button>



        <div className="mt-auto text-center text-gray-400 text-xs">
          Public chat is free and open to all users
        </div>
      </div>
    </div>
  );
};