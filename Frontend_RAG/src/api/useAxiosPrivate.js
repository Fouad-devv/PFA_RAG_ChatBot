import { useEffect } from "react";
import axios from "axios";
import { useKeycloak } from "@react-keycloak/web";

const axiosPrivate = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

const useAxiosPrivate = () => {
  const { keycloak } = useKeycloak();

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      async (config) => {
        if (!keycloak?.authenticated) return config;

        try {
          await keycloak.updateToken(30); // refresh if needed
          config.headers.Authorization = `Bearer ${keycloak.token}`;
        } catch (err) {
          console.error("Token refresh failed", err);
        }

        return config;
      }
    );

    return () => { axiosPrivate.interceptors.request.eject(requestIntercept); };
  }, [keycloak]);

  return axiosPrivate;
};

export default useAxiosPrivate;