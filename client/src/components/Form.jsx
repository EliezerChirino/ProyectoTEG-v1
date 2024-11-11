import { useState } from 'react';
import axios from 'axios';  // Asegúrate de que axios esté instalado: npm install axios

const Form = () => {
    const [formData, setFormData] = useState({
        deviceName: '',
        deviceIP: '',
        deviceDescription: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:8080/api/devices", formData);
            console.log('Respuesta del servidor:', response.data);
            alert('Formulario enviado con éxito');
            setFormData({
                deviceName: '',
                deviceIP: '',
                deviceDescription: '',
            });
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            alert('Hubo un error al enviar el formulario.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center mt-[50px] flex-col hover:shadow-none">
            <form onSubmit={handleSubmit} className='form hover:shadow-none transition-all duration-300 w '>
                <h2 className='text-xl text-center'>Formulario de registro de dispositivo</h2>

                <label htmlFor="deviceName" className="label">
                    <span className="title">Nombre del dispositivo</span>
                    <input
                        className="input-field"
                        type="text"
                        id="deviceName"
                        name="deviceName"
                        title="Nombre del dispositivo"
                        placeholder="Ingrese un nombre del dispositivo"
                        value={formData.deviceName}
                        onChange={handleChange}
                    />
                </label>

                <label htmlFor="deviceIP" className="label">
                    <span className="title">IP del dispositivo</span>
                    <input
                        id="deviceIP"
                        className="input-field"
                        type="text"
                        name="deviceIP"
                        title="IP del dispositivo"
                        placeholder="Por ejemplo: 192.168.100.1"
                        value={formData.deviceIP}
                        onChange={handleChange}
                    />
                </label>

                <label htmlFor="deviceDescription" className="label">
                    <span className="title">Descripción del dispositivo</span>
                    <input
                        id="deviceDescription"
                        className="input-field"
                        type="text"
                        name="deviceDescription"
                        title="Descripción"
                        placeholder="Escriba qué tipo de dispositivo es"
                        value={formData.deviceDescription}
                        onChange={handleChange}
                    />
                </label>

                <input className="checkout-btn" type="submit" value="Enviar" id="enviar" />
            </form>
        </div>
    );
};

export default Form;
