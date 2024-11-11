import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import DataTable from 'react-data-table-component';
import axios from 'axios';

const socket = io('http://localhost:8080', {
    transports: ['websocket'],
});

const Dispositivos = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [formData, setFormData] = useState({
        deviceName: '',
        deviceIP: '',
        deviceDescription: '',
    });

    const fetchDevices = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/obtener_dispositivos');
            if (!response.ok) {
                throw new Error('Error al obtener los dispositivos');
            }
            const data = await response.json();

            setDevices((prevDevices) => {
                return data.map((device, index) => {
                    const existingDevice = prevDevices.find((d) => d.index === index);
                    return {
                        ...device,
                        index,
                        status: existingDevice ? existingDevice.status : null,
                    };
                });
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const sendDevicesData = useCallback(() => {
        devices.forEach((device) => {
            console.log('Enviando dispositivo:', device);
            socket.emit('enviar_device_info', {
                DeviceName: device.DeviceName,
                DeviceDescripcion: device.DeviceDescripcion,
                DeviceIP: device.DeviceIP,
                index: device.index,
            });
        });
    }, [devices]);

    const updateDeviceStatus = useCallback((response) => {
        setDevices((prevDevices) =>
            prevDevices.map((device) =>
                device.index === response.index
                    ? { ...device, status: response.status }
                    : device
            )
        );
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            console.log('Enviando datos de dispositivos por socket...');
            sendDevicesData();
        }, 35000);

        return () => clearInterval(intervalId);
    }, [sendDevicesData]);

    useEffect(() => {
        fetchDevices();
        socket.on('respuesta_device_info', (response) => {
            console.log('Respuesta del servidor:', response);
            updateDeviceStatus(response);
        });

        return () => {
            socket.off('respuesta_device_info');
        };
    }, [updateDeviceStatus]);

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
            fetchDevices(); // Actualizar la lista de dispositivos después de agregar uno nuevo
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            alert('Hubo un error al enviar el formulario.');
        }
    };

    const columns = [
        {
            name: 'Nombre del Dispositivo',
            selector: (row) => row.DeviceName,
            sortable: true,
        },
        {
            name: 'Descripción',
            selector: (row) => row.DeviceDescripcion,
            sortable: true,
        },
        {
            name: 'IP',
            selector: (row) => row.DeviceIP,
            sortable: true,
        },
        {
            name: 'Estado',
            selector: (row) => (row.status ? 'Online' : 'Offline'),
            sortable: true,
            conditionalCellStyles: [
                {
                    when: (row) => row.status,
                    style: {
                        backgroundColor: 'rgba(63, 195, 128, 0.9)',
                        color: 'white',
                    },
                },
                {
                    when: (row) => !row.status,
                    style: {
                        backgroundColor: '#ff0808',
                        color: 'white',
                    },
                },
            ],
        },
    ];

    const filteredDevices = devices.filter((device) =>
        device.DeviceName.toLowerCase().includes(filterText.toLowerCase()) ||
        device.DeviceDescripcion.toLowerCase().includes(filterText.toLowerCase()) ||
        device.DeviceIP.includes(filterText)
    );

    if (loading) {
        return <div>Cargando dispositivos...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className=' flex flex-col w-full' >
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center mt-[50px] flex-col hover:shadow-none'>
                <h2>Gestión de Dispositivos</h2>

                {/* Formulario para agregar dispositivos */}
                <form onSubmit={handleSubmit} className='form hover:shadow-none transition-all duration-300 w-full mb-8'>
                    <h3 className='text-xl text-center'>Agregar nuevo dispositivo</h3>

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

                    <input className="checkout-btn" type="submit" value="Agregar Dispositivo" id="enviar" />
                </form>
            </div>
            

            {/* Campo de búsqueda para la tabla */}
            <div className=' max-w-6xl mx-36 px-4 sm:px-6 lg:px-8 flex justify-center items-center mt-[50px] flex-col hover:shadow-none  contenedor-class'>
            <div className="flex justify-start w-full mb-4">
                <label htmlFor="filterText" className="label w-full">
                    <span className="title">Filtrar dispositivos</span>
                    <input
                        className="input-field"
                        type="text"
                        id="filterText"
                        placeholder="Filtrar por nombre, IP o descripción"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </label>
            </div>

            {/* DataTable con dispositivos filtrados */}
            <DataTable
                columns={columns}
                data={filteredDevices}
                pagination
                highlightOnHover
                striped
                responsive
            />
            </div>
            
        </div>
    );
};

export default Dispositivos;