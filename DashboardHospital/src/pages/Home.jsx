import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { habitacionesData } from '../data/hospitalData';

const WS_URL = window.location.protocol === "https:" ?
  "wss://" + window.location.host + "/ws" :
  "ws://" + window.location.hostname + ":3000";

const HomeContainer = styled.div`
  padding: 20px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 20px;
  height: 100vh;
`;

const PlanoContainer = styled.div`
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const PlanoFila = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(100px, 1fr));
  gap: 10px;

  &.fila-inferior {
    display: grid;
    grid-template-columns: repeat(5, minmax(100px, 1fr)) 100px;
    gap: 10px;

    .main-rooms {
      display: contents;
    }
    
    .ee-section {
      grid-column: 6;
      margin-left: 40px;
    }
  }
`;

// Animación de parpadeo para llamado
const blinkLlamado = keyframes`
  0%, 100% { background: #fbb; border-color: #f00; }
  50% { background: #fff; border-color: #fff; }
`;

// Animación de parpadeo para emergencia
const blinkEmergencia = keyframes`
  0%, 100% { background:rgb(82, 125, 255); border-color:rgb(28, 124, 183); }
  50% { background: #fff; border-color: #fff; }
`;

const CeldaHabitacion = styled.div`
  aspect-ratio: 1;
  padding: 15px;
  background: ${props => props.$tipo === 'EE' ? '#e0e0e0' : 'white'};
  border: 2px solid #ccc;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: ${props => props.$tipo === 'EE' ? 'normal' : 'bold'};
  ${props =>
    props.$status === 'llamado' &&
    css`
      animation: ${blinkLlamado} 1s steps(2, jump-none) infinite;
      border-style: dashed;
    `}
  ${props =>
    props.$status === 'emergencia' &&
    css`
      animation: ${blinkEmergencia} 0.7s steps(2, jump-none) infinite;
      border-style: dashed;
    `}
`;

const InformacionContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
`;

const InformacionContainer2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 4fr;
  gap: 20px;
  margin-top: 20px;
`;
const LlamadaEnProceso = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const TablaHabitaciones = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  h2 {
    margin-bottom: 15px;
    color: #2c3e50;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    tr.en-llamada {
      background: #fff5f5;
    }
  }
`;

const Home = () => {
    // Añade el campo status por defecto a cada habitación
    const [habitaciones, setHabitaciones] = useState(
        habitacionesData.map(h => ({ ...h, status: 'normal' }))
    );
    const wsRef = useRef(null);

    // Estado para timestamps y tiempos finales
    const [statusTimestamps, setStatusTimestamps] = useState({});
    const [finalTimes, setFinalTimes] = useState({});

    // Estado para forzar render cada segundo
    const [, setTick] = useState(0);

    // Encuentra la habitación en llamado o emergencia
    const habitacionEnLlamada = habitaciones.find(
        h => h.status === 'llamado' || h.status === 'emergencia'
    );

    // Intervalo para actualizar el tiempo cada segundo
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    // WebSocket: actualiza timestamps y tiempos finales según status recibido
    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket conectado');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (!data.topic || !data.message) return;
                const match = data.topic.match(/hospital\/camas_(\d+)/);
                if (match) {
                    const numero = parseInt(match[1], 10);
                    const payload = JSON.parse(data.message);

                    setHabitaciones(prev =>
                        prev.map(h =>
                            h.numero === numero
                                ? { ...h, status: payload.status }
                                : h
                        )
                    );

                    // Si es llamado o emergencia, guarda timestamp de inicio
                    if (payload.status === 'llamado' || payload.status === 'emergencia') {
                        setStatusTimestamps(prev => ({
                            ...prev,
                            [numero]: Date.now()
                        }));
                        setFinalTimes(prev => ({
                            ...prev,
                            [numero]: null
                        }));
                    }
                    // Si es cancelar, calcula y guarda el tiempo final
                    if (payload.status === 'Llamado atendido' && statusTimestamps[numero]) {
                        const tiempo = Math.floor((Date.now() - statusTimestamps[numero]) / 1000);
                        setFinalTimes(prev => ({
                            ...prev,
                            [numero]: tiempo
                        }));
                        setStatusTimestamps(prev => ({
                            ...prev,
                            [numero]: null
                        }));
                    }
                }
            } catch (err) {
                console.error('Error procesando mensaje MQTT:', err);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket desconectado');
        };

        return () => {
            ws.close();
        };
    }, [statusTimestamps]);

    // Calcula el tiempo en proceso o muestra el tiempo final si fue cancelado
    let tiempoEnProceso = null;
    let habitacionActual = null;
    if (habitacionEnLlamada) {
        habitacionActual = habitacionEnLlamada.numero;
        if (statusTimestamps[habitacionActual]) {
            tiempoEnProceso = Math.floor((Date.now() - statusTimestamps[habitacionActual]) / 1000);
        }
    } else {
        // Busca la última habitación cancelada
        const ultimaCancelada = Object.keys(finalTimes)
            .filter(num => finalTimes[num] !== null)
            .map(num => ({ num, tiempo: finalTimes[num] }))
            .sort((a, b) => b.tiempo - a.tiempo)[0];
        if (ultimaCancelada) {
            habitacionActual = ultimaCancelada.num;
            tiempoEnProceso = ultimaCancelada.tiempo;
        }
    }

    const renderCelda = (numero) => {
        if (numero === 'EE') {
            return <CeldaHabitacion $tipo="EE">EE</CeldaHabitacion>;
        }
        const habitacion = habitaciones.find(h => h.numero === numero);
        if (!habitacion) {
            return <CeldaHabitacion $isEmpty />;
        }
        return (
            <CeldaHabitacion
                $tipo={undefined}
                $status={habitacion.status}
            >
                <p className='centrar'> {'Habitacion'} <br/>{  habitacion.numero} </p> 
            </CeldaHabitacion>
        );
    };

    // Split rooms into two arrays
    const tercio = Math.ceil(habitaciones.length / 3);
    const primeraTabla = habitaciones.slice(0, tercio);
    const segundaTabla = habitaciones.slice(tercio, tercio * 2);
    const terceraTabla = habitaciones.slice(tercio * 2, habitaciones.length);

    return (
        <HomeContainer>
            <InformacionContainer2>
                <LlamadaEnProceso>
                    <h2>Llamado en proceso</h2>
                    {habitacionEnLlamada ? (
                        <div>
                            <p><strong>Habitación:</strong> {habitacionEnLlamada.numero}</p>
                            <p><strong>Paciente:</strong> {habitacionEnLlamada.paciente}</p>
                            <p><strong>Estado:</strong> {habitacionEnLlamada.status}</p>
                            {habitacionEnLlamada.riesgo && (
                                <p><strong>Factor de riesgo:</strong> {habitacionEnLlamada.riesgo}</p>
                            )}
                            <p>
                                <strong>Tiempo en proceso:</strong>{" "}
                                {tiempoEnProceso !== null ? `${tiempoEnProceso} segundos` : "0 segundos"}
                            </p>
                        </div>
                    ) : tiempoEnProceso !== null ? (
                        <div>
                            <p><strong>Habitación:</strong> {habitacionActual}</p>
                            <p><strong>Estado:</strong> Cancelado</p>
                            <p>
                                <strong>Tiempo total:</strong>{" "}
                                {`${tiempoEnProceso} segundos`}
                            </p>
                        </div>
                    ) : (
                        <p>No hay llamados activos</p>
                    )}
                </LlamadaEnProceso>


                <PlanoContainer>
                    <PlanoFila>
                        {[402, 403, 404, 405, 406, 407].map((num, index) => (
                            <React.Fragment key={index}>
                                {renderCelda(num)}
                            </React.Fragment>
                        ))}
                    </PlanoFila>
                    <PlanoFila className="fila-inferior">
                        <div className="main-rooms">
                            {[408, 409, 410, 411].map((num, index) => (
                                <React.Fragment key={index}>
                                    {renderCelda(num)}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="ee-section">
                            {renderCelda('EE')}
                        </div>
                    </PlanoFila>
                </PlanoContainer>
            </InformacionContainer2>            
            <InformacionContainer>

                <TablaHabitaciones>
                    <h2>Detalle por Habitación</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Habitación</th>
                                <th>Paciente</th>
                                <th>Enfermero</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {primeraTabla.map(hab => (
                                <tr 
                                    key={hab.numero}
                                    className={hab.status === 'llamado' || hab.status === 'emergencia' ? 'en-llamada' : ''}
                                >
                                    <td>{hab.numero}</td>
                                    <td>{hab.paciente}</td>
                                    <td>{hab.enfermero}</td>
                                    <td>{hab.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TablaHabitaciones>
                <TablaHabitaciones>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Habitación</th>
                                <th>Paciente</th>
                                <th>Enfermero</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {segundaTabla.map(hab => (
                                <tr 
                                    key={hab.numero}
                                    className={hab.status === 'llamado' || hab.status === 'emergencia' ? 'en-llamada' : ''}
                                >
                                    <td>{hab.numero}</td>
                                    <td>{hab.paciente}</td>
                                    <td>{hab.enfermero}</td>
                                    <td>{hab.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TablaHabitaciones>
                <TablaHabitaciones>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Habitación</th>
                                <th>Paciente</th>
                                <th>Enfermero</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {terceraTabla.map(hab => (
                                <tr 
                                    key={hab.numero}
                                    className={hab.status === 'llamado' || hab.status === 'emergencia' ? 'en-llamada' : ''}
                                >
                                    <td>{hab.numero}</td>
                                    <td>{hab.paciente}</td>
                                    <td>{hab.enfermero}</td>
                                    <td>{hab.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TablaHabitaciones>
            </InformacionContainer>
        </HomeContainer>
    );
};

export default Home;