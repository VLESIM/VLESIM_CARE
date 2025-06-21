const mqtt = require('mqtt');
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Archivo para persistir los tópicos
const TOPICS_FILE = path.join(__dirname, 'mqtt_topics.json');
const LLAMADOS_FILE = path.join(__dirname, 'llamados_stats.json');

// Cargar tópicos guardados o usar los predeterminados
let mqttTopics = [
  'hospital/camas_402',
  'hospital/camas_403',
  'hospital/camas_404',
  'hospital/camas_405',
  'hospital/camas_406',
  'hospital/camas_407',
  'hospital/camas_408',
  'hospital/camas_409',
  'hospital/camas_410',
  'hospital/camas_411'
];

try {
    if (fs.existsSync(TOPICS_FILE)) {
        const savedTopics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
        mqttTopics = savedTopics;
        console.log('📚 Tópicos cargados:', mqttTopics);
    }
} catch (error) {
    console.error('❌ Error cargando tópicos:', error);
}

// Función para guardar tópicos
const saveTopics = () => {
    fs.writeFileSync(TOPICS_FILE, JSON.stringify(mqttTopics, null, 2));
};

// Cargar o inicializar los contadores
let llamadosStats = {};
if (fs.existsSync(LLAMADOS_FILE)) {
    llamadosStats = JSON.parse(fs.readFileSync(LLAMADOS_FILE, 'utf8'));
} else {
    mqttTopics.forEach(topic => {
        llamadosStats[topic] = { llamado: 0, emergencia: 0 };
    });
}

// Función para guardar los contadores
const saveLlamadosStats = () => {
    fs.writeFileSync(LLAMADOS_FILE, JSON.stringify(llamadosStats, null, 2));
};

// Endpoint para sincronizar tópicos desde el frontend
app.post('/sync-topics', (req, res) => {
    const { topics } = req.body;
    
    if (!Array.isArray(topics)) {
        return res.status(400).json({ error: 'Topics must be an array' });
    }

    // Desuscribirse de los tópicos antiguos
    mqttTopics.forEach(topic => {
        mqttClient.unsubscribe(topic);
    });

    // Actualizar lista de tópicos
    mqttTopics = [...new Set(topics)]; // Eliminar duplicados
    saveTopics();

    // Suscribirse a todos los tópicos
    mqttTopics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.error(`❌ Error al suscribirse a ${topic}:`, err);
            } else {
                console.log(`📡 Suscrito a ${topic}`);
            }
        });
    });

    res.json({ success: true, topics: mqttTopics });
});

// Crear servidor HTTP
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Conectarse al broker MQTT
const mqttClient = mqtt.connect('mqtt://35.193.246.15:1883');

// Suscribirse a los tópicos iniciales
mqttClient.on('connect', () => {
  mqttTopics.forEach(topic => {
    mqttClient.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Error al suscribirse a ${topic}:`, err);
      } else {
        console.log(`📡 Suscrito a ${topic}`);
      }
    });
  });
});

// Cuando llega un mensaje MQTT
mqttClient.on('message', (topic, message) => {
  try {
        const payload = JSON.parse(message.toString());
        if (!llamadosStats[topic]) {
            llamadosStats[topic] = { llamado: 0, emergencia: 0 };
        }
        if (payload.status === 'llamado') {
            llamadosStats[topic].llamado += 1;
            saveLlamadosStats();
        }
        if (payload.status === 'emergencia') {
            llamadosStats[topic].emergencia += 1;
            saveLlamadosStats();
        }
    } catch (err) {
        console.error('Error procesando mensaje MQTT:', err);
    }

  const payload = {
    topic,
    message: message.toString(),
    timestamp: new Date()
  };

  // Reenviar a todos los clientes WebSocket conectados
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
});

// WebSocket: nuevo cliente conectado
wss.on('connection', (ws) => {
  console.log('🔌 Cliente WebSocket conectado');
  ws.send(JSON.stringify({ status: 'connected', msg: 'WebSocket listo para recibir datos MQTT' }));
});

// Endpoint para obtener estadísticas de llamados
app.get('/llamados-stats', (req, res) => {
    res.json(llamadosStats);
});

// Iniciar servidor HTTP y WebSocket
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});