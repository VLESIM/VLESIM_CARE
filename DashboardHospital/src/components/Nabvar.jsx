import styled from 'styled-components';
import { FaUser } from 'react-icons/fa';

const NavbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  background: #ffffff;
`;

const Title = styled.p`
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  color: #2c3e50;
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2c3e50;
  
  svg {
    font-size: 1.1rem;
  }
`;

const Navbar = () => {
    return (
        <NavbarContainer>
            <Title>Hospital Dashboard</Title>
            <UserProfile>
                <FaUser />
                <span>admin</span>
            </UserProfile>
        </NavbarContainer>
    );
};

export default Navbar;
