import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { habitacionesData } from "../data/hospitalData";
import styled from "styled-components";
import "chart.js/auto";

const API_URL = "http://localhost:3000/llamados-stats";

const DashContainer = styled.div`
  height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr); // 2 columnas
  grid-template-rows: repeat(2, 1fr);    // 2 filas
  gap: 32px;
  margin-top: 32px;
  padding: 0 24px 24px 24px;
  overflow-y: auto;
  flex: 1;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(44, 62, 80, 0.08);
  padding: 24px 20px 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CardTitle = styled.h3`
  margin-bottom: 18px;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
`;

const PieWrapper = styled.div`
  width: 320px;
  height: 320px;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Dash = () => {
  const [llamadosStats, setLlamadosStats] = useState({});
  const [llamadosLog, setLlamadosLog] = useState([]);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setLlamadosStats(data));
    // fetch("http://localhost:3000/llamados-log")
    //   .then(res => res.json())
    //   .then(data => setLlamadosLog(data));
  }, []);

  // 1. Cuántos llamados ha tenido cada paciente
  const llamadosPorPaciente = {};
  habitacionesData.forEach((hab) => {
    const topic = `hospital/camas_${hab.numero}`;
    llamadosPorPaciente[hab.paciente] =
      (llamadosPorPaciente[hab.paciente] || 0) +
      (llamadosStats[topic]?.llamado || 0);
  });

  // 2. Cuántos pacientes atendió cada enfermero (con al menos un llamado)
  const pacientesPorEnfermero = {};
  habitacionesData.forEach((hab) => {
    const topic = `hospital/camas_${hab.numero}`;
    if ((llamadosStats[topic]?.llamado || 0) > 0) {
      pacientesPorEnfermero[hab.enfermero] =
        (pacientesPorEnfermero[hab.enfermero] || 0) + 1;
    }
  });

  // 3. Media de tiempo en atención (requiere timestamps de llamado/cancelar)
  let mediaTiempo = "N/A";
  if (llamadosLog.length > 0) {
    const tiempos = [];
    const llamadosPendientes = {};
    llamadosLog.forEach((log) => {
      if (log.status === "llamado" || log.status === "emergencia") {
        llamadosPendientes[log.topic] = new Date(log.timestamp);
      }
      if (log.status === "cancelar" && llamadosPendientes[log.topic]) {
        const inicio = llamadosPendientes[log.topic];
        const fin = new Date(log.timestamp);
        tiempos.push((fin - inicio) / 1000); // segundos
        delete llamadosPendientes[log.topic];
      }
    });
    if (tiempos.length > 0) {
      const media = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      mediaTiempo = `${(media / 60).toFixed(2)} min`;
    }
  }

  // 5. Frecuencia de cada llamado (llamado vs emergencia)
  let totalLlamado = 0;
  let totalEmergencia = 0;
  Object.values(llamadosStats).forEach((stat) => {
    totalLlamado += stat.llamado;
    totalEmergencia += stat.emergencia;
  });

  return (
    <DashContainer>
      <h1 style={{ color: "#2c3e50", margin: "24px 0 0 24px" }}>Dashboard</h1>
      <DashboardGrid>
        {/* 1. Llamados por paciente */}
        <Card>
          <CardTitle>Llamados por Paciente</CardTitle>
          <Bar
            data={{
              labels: Object.keys(llamadosPorPaciente),
              datasets: [
                {
                  label: "Llamados",
                  data: Object.values(llamadosPorPaciente),
                  backgroundColor: "#36a2eb",
                },
              ],
            }}
            options={{ plugins: { legend: { display: false } } }}
          />
        </Card>
        {/* 2. Pacientes atendidos por enfermero */}
        <Card>
          <CardTitle>Pacientes Atendidos por Enfermero</CardTitle>
          <Bar
            data={{
              labels: Object.keys(pacientesPorEnfermero),
              datasets: [
                {
                  label: "Pacientes",
                  data: Object.values(pacientesPorEnfermero),
                  backgroundColor: "#ff6384",
                },
              ],
            }}
            options={{ plugins: { legend: { display: false } } }}
          />
        </Card>
        {/* 3. Media de tiempo en atención */}
        <Card>
          <CardTitle>Media de Tiempo en Atención</CardTitle>
          <div
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#2c3e50",
              marginTop: 24,
            }}
          >
            {mediaTiempo}
          </div>
        </Card>
        {/* 5. Frecuencia de cada llamado */}
        <Card>
          <CardTitle>Frecuencia de Llamados</CardTitle>
          <PieWrapper>
            <Pie
              data={{
                labels: ["Llamado", "Emergencia"],
                datasets: [
                  {
                    data: [totalLlamado, totalEmergencia],
                    backgroundColor: ["#36a2eb", "#ff6384"],
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    display: true,
                    position: "bottom",
                  },
                },
                maintainAspectRatio: false,
              }}
              width={220}
              height={220}
            />
          </PieWrapper>
        </Card>
      </DashboardGrid>
    </DashContainer>
  );
};

export default Dash;