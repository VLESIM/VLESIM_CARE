import { useEffect, useState } from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const BedInfo = styled.div`
  margin-bottom: 15px;
  
  h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.2rem;
  }
  
  p {
    margin: 5px 0;
    color: #7f8c8d;
  }
`;

const StatusIndicators = styled.div`
  display: flex;
  gap: 10px;
`;

const Indicator = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'red': return '#e74c3c';
      case 'green': return '#2ecc71';
      case 'yellow': return '#f1c40f';
      default: return '#bdc3c7';
    }
  }};
  opacity: ${props => props.active ? 1 : 0.3};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #c0392b;
  }
`;

const CardContainer = styled(Card)`
  position: relative;
`;

const BedCard = ({ bed, onDelete }) => {
  const [status, setStatus] = useState(bed.status);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket("ws://148.113.207.229:3000"); // o IP pública del backend

    socket.onopen = () => {
      console.log(`🔌 WebSocket conectado para cama ${bed.bedNumber}`);
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.topic === bed.mqttTopic && data.message) {
          const payload = JSON.parse(data.message); // si el contenido del mensaje es un JSON
          if (payload.status) {
            setStatus(payload.status);
          }
        }
      } catch (error) {
        console.error("❌ Error procesando datos WebSocket:", error);
      }
    };

    socket.onerror = (err) => {
      console.error("❌ Error WebSocket:", err);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log("🔌 WebSocket desconectado");
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [bed.mqttTopic, bed.bedNumber]);

  return (
    <CardContainer>
      <DeleteButton onClick={() => onDelete(bed.id)} title="Eliminar cama">
        ×
      </DeleteButton>
      <BedInfo>
        <h3>Cama {bed.bedNumber}</h3>
        <p>Habitación {bed.room}</p>
        <p>Tópico: {bed.mqttTopic}</p>
        <p style={{ color: isConnected ? '#2ecc71' : '#e74c3c' }}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </p>
      </BedInfo>
      <StatusIndicators>
        <Indicator 
          status="green" 
          active={status === 'green'} 
          title="Disponible"
        />
        <Indicator 
          status="yellow" 
          active={status === 'yellow'} 
          title="En limpieza"
        />
        <Indicator 
          status="red" 
          active={status === 'red'} 
          title="Ocupada"
        />
      </StatusIndicators>
    </CardContainer>
  );
};

export default BedCard;
