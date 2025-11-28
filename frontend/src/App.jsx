import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ReservarSala from './components/ReservarSala';
import Calendario from './components/Calendario';

function App() {
  const [medico, setMedico] = useState(null);
  const [vista, setVista] = useState('dashboard'); // dashboard | reservar | calendario

  useEffect(() => {
    // Verificar si hay sesión activa
    const token = localStorage.getItem('token');
    const medicoData = localStorage.getItem('medico');

    if (token && medicoData) {
      try {
        setMedico(JSON.parse(medicoData));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('medico');
      }
    }
  }, []);

  const handleLogin = (medicoData) => {
    setMedico(medicoData);
    setVista('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('medico');
    setMedico(null);
    setVista('dashboard');
  };

  const handleReservar = () => {
    setVista('reservar');
  };

  const handleCalendario = () => {
    setVista('calendario');
  };

  const handleVolver = () => {
    setVista('dashboard');
  };

  const handleReservaCreada = () => {
    setVista('dashboard');
  };

  // Si no hay médico autenticado, mostrar login
  if (!medico) {
    return <Login onLogin={handleLogin} />;
  }

  // Renderizar vista según estado
  if (vista === 'reservar') {
    return (
      <ReservarSala
        onVolver={handleVolver}
        onReservaCreada={handleReservaCreada}
      />
    );
  }

  if (vista === 'calendario') {
    return (
      <Calendario
        medico={medico}
        onVolver={handleVolver}
      />
    );
  }

  return (
    <Dashboard
      medico={medico}
      onLogout={handleLogout}
      onReservar={handleReservar}
      onCalendario={handleCalendario}
    />
  );
}

export default App;
