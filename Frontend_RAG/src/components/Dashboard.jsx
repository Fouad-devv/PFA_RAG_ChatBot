
import useAxiosPrivate from '../api/useAxiosPrivate';
import { useEffect, useState } from 'react';

export const Dashboard = () => {
  const axiosPrivate = useAxiosPrivate();
  const [employees, setEmployees] = useState([]);
  const [noAccess, setNoAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axiosPrivate.get('/api/employes');
        setEmployees(res.data);

      } catch (err) {
        if (err.response?.status === 403) {  // User is authenticated but does not have the required role
          setNoAccess(true);
        } else if (err.response?.status === 401) { // User is not authenticated
          window.location.href = '/login';
        } else {
          console.error(err);
        }
        } finally {
          setLoading(false);
        }
      }

    fetchEmployees();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (noAccess) return <h1>No acsess</h1>; // Show your "No Access" page

  return (
    <div>
      {employees.map(emp => (
        <p key={emp.id}>{emp.firstName} {emp.lastName}</p>
      ))}
    </div>
  );
};


