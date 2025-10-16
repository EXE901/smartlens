import { useNavigate } from 'react-router-dom';

const Navigation = ({ onSignOut }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    if (onSignOut) onSignOut();
    navigate('/login');
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'flex-end', 
      padding: '20px',
      gap: '15px'
    }}>
      <p 
        onClick={() => navigate('/profile')} 
        className='f3 link dim black underline pa3 pointer'
        style={{ color: '#fff', cursor: 'pointer' }}
      >
        Profile
      </p>
      <p 
        onClick={handleSignOut} 
        className='f3 link dim black underline pa3 pointer'
        style={{ color: '#fff', cursor: 'pointer' }}
      >
        Sign Out
      </p>
    </nav>
  );
};

export default Navigation;
