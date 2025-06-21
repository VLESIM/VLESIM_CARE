import { useState } from 'react';
import styled from 'styled-components';

const FormContainer = styled.form`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
  
  label {
    display: block;
    margin-bottom: 5px;
    color: #2c3e50;
  }
  
  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
`;

const SubmitButton = styled.button`
  background: #2c3e50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #34495e;
  }
`;

const AddBedForm = ({ onAddBed }) => {
  const [formData, setFormData] = useState({
    room: '',
    bedNumber: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newBed = {
      id: Date.now(),
      room: formData.room,
      bedNumber: formData.bedNumber,
      mqttTopic: `hospital/camas_${formData.bedNumber}`,
      status: 'green'
    };

    try {
      // Send new topic to backend
      const response = await fetch('http://localhost:3000/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: newBed.mqttTopic })
      });

      if (!response.ok) {
        throw new Error('Failed to update MQTT topics');
      }

      onAddBed(newBed);
      setFormData({ room: '', bedNumber: '' });
    } catch (error) {
      console.error('Error updating MQTT topics:', error);
      alert('Error al agregar la nueva cama. Por favor intente de nuevo.');
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <InputGroup>
        <label>Habitación:</label>
        <input
          type="text"
          value={formData.room}
          onChange={(e) => setFormData({...formData, room: e.target.value})}
          required
        />
      </InputGroup>
      <InputGroup>
        <label>Número de Cama:</label>
        <input
          type="text"
          value={formData.bedNumber}
          onChange={(e) => setFormData({...formData, bedNumber: e.target.value})}
          required
        />
      </InputGroup>
      <SubmitButton type="submit">Agregar Cama</SubmitButton>
    </FormContainer>
  );
};

export default AddBedForm;