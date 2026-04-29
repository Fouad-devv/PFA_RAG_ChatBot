import { useEffect, useState , useContext} from 'react';
import { Routes, Route } from 'react-router-dom';
import useAxiosPrivate from './api/useAxiosPrivate';
import { useKeycloak } from '@react-keycloak/web';


// components
import {ProtectedRoute} from './components/ProtectedRoute';

//pages
import {Public} from './pages/public/public';
import {Home} from './pages/home/Home';



function App() {

  const { keycloak  , initialized } = useKeycloak();
  const axiosPrivate = useAxiosPrivate();


  
  

  return (

    <Routes>

      <Route path="/" element = {<Public />} />
      

      <Route path="/home" element = {
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
        } 
      />

      
    </Routes>
  );
}

export default App;
