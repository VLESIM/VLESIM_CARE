import { NavLink } from "react-router-dom";
import { FaHome, FaBars } from "react-icons/fa";
import { MdDashboardCustomize } from "react-icons/md";
import styled from "styled-components";
import logo from "../assets/logo.png"; 

const SidebarContainer = styled.div`
  background: #2c3e50;
  width: ${({ isCollapsed }) => (isCollapsed ? "80px" : "250px")};
  min-height: 100vh;
  transition: all 0.3s ease;
  padding: 20px 0;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;

const LogoImg = styled.img`
  width: ${({ $isCollapsed }) => ($isCollapsed ? "40px" : "120px")};
  height: auto;
  transition: width 0.3s;
`;

const ToggleButton = styled.button`
  background: #34495e;
  border: none;
  color: white;
  padding: 8px;
  margin: 0 20px 20px;
  border-radius: 5px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #3498db;
  }
`;

const StyledNavLink = styled(NavLink)`
  color: #ecf0f1 !important;
  text-decoration: none;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  margin: 0 10px;
  border-radius: 8px;  // Movido aquí para que esté siempre presente
  transition: all 0.2s ease;  // Modificada para incluir todas las propiedades

  &:hover {
    background: #34495e;
  }

  &.active {
    background: #3498db;
  }

  svg {
    font-size: 1.2em;
    min-width: 24px;
  }
`;

const LinkText = styled.span`
  margin-left: 10px;
  opacity: ${({ isCollapsed }) => (isCollapsed ? "0" : "1")};
  display: ${({ isCollapsed }) => (isCollapsed ? "none" : "inline")};
  transition: opacity 0.3s;
`;

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <SidebarContainer isCollapsed={isCollapsed}>
      <LogoContainer>
        <LogoImg src={logo} alt="Logo" $isCollapsed={isCollapsed} />
      </LogoContainer>
      <ToggleButton onClick={() => setIsCollapsed(!isCollapsed)}>
        <FaBars />
      </ToggleButton>
      
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>
          <StyledNavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
            <FaHome />
            <LinkText isCollapsed={isCollapsed}>Home</LinkText>
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/Dash" exact activeClassName="active">
            <MdDashboardCustomize />
            <LinkText isCollapsed={isCollapsed}>Dashboard</LinkText>
          </StyledNavLink>
        </li>
      </ul>
    </SidebarContainer>
  );
};

export default Sidebar;


