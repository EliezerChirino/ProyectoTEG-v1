    import { useEffect, useState } from 'react';
    import io from 'socket.io-client';
    import DataTable from 'react-data-table-component';

    const socket = io('http://localhost:8080', {
        transports: ['websocket'],  
    });

    const DeviceTable = () => {
        const [devices, setDevices] = useState([]); 
        const [filterText, setFilterText] = useState(''); 
        const [error, setError] = useState(null); 

        useEffect(() => {
            // Escuchar actualizaciones en tiempo real cada 5 segundos
            socket.on('updateData', (data) => {
                console.log('Datos actualizados recibidos:', data);
                


                // Añadir el índice a cada dispositivo
                const devicesWithIndex = data.map((device, index) => ({
                    ...device,
                    index // Añadir el campo "index"
                }));

                // Actualizar los dispositivos en el estado
                setDevices(devicesWithIndex);

                devicesWithIndex.forEach((device) => {
                    sendDeviceToBackend(device);
                    });
                });


            // Manejar posibles errores de conexión
            socket.on('connect_error', (err) => {
                console.error('Error de conexión:', err);
                setError('Hubo un problema al conectarse al servidor.');
            });

            // Limpieza al desmontar el componente
            return () => {
                socket.off('updateData');
                socket.off('connect_error');
            };
        }, []);  // [] asegura que solo se ejecute al montar el componente

        // Función para enviar un dispositivo al backend con su IP e índice
        const sendDeviceToBackend = async (device) => {
            try {
                const response = await fetch(`http://localhost:8080/api/dameIP?name=${device.DeviceName}&ip=${device.DeviceIP}&description=${device.DeviceDescripcion}&index=${device.index}`);

                
                
                if (!response.ok) {
                    throw new Error(`Error del servidor: ${response.statusText}`);
                }
        
                const result = await response.json();  
                console.log( ` Respuesta del backend para IP ${device.DeviceIP}:`, result);
            } catch (err) {
                console.error(`Error al enviar el dispositivo ${device.DeviceIP}:`, err);
            }
        };
        

        if (error) return <p>{error}</p>;



        // columnas para la tabla
        const columns = [
            {
                name: 'Nombre del Dispositivo',
                selector: row => row.DeviceName,
                sortable: true,
            },
            {
                name: 'IP del Dispositivo',
                selector: row => row.DeviceIP,
                sortable: true,
            },
            {
                name: 'Descripción',
                selector: row => row.DeviceDescripcion,
            },
            {
                name: 'Estado',
                selector: row => row.status ? 'Online' : 'Offline', // Mostrar "Online" o "Offline" basado en el estado
                sortable: true,
            },
        ];

        // Filtrar los dispositivos en función del texto de búsqueda
        const filteredDevices = devices.filter(
            device =>
                device.DeviceName && device.DeviceName.toLowerCase().includes(filterText.toLowerCase()) ||
                device.DeviceIP && device.DeviceIP.toLowerCase().includes(filterText.toLowerCase()) ||
                device.DeviceDescripcion && device.DeviceDescripcion.toLowerCase().includes(filterText.toLowerCase())
        );

        return (
            <div className="device-table max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center mt-[50px] flex-col hover:shadow-none contenedor-class ">
                <h2>Lista de Dispositivos</h2>

                <div className="flex justify-start w-[100%]  ">
                    <label htmlFor="deviceDescription" className="label w-[30%]">
                        <span className="title">Descripción del dispositivo</span>
                        <input
                            className="input-field  "
                            type="text"
                            placeholder="Filtrar por nombre, IP o descripción"
                            title="Descripción"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </label>
                </div>
                
                <DataTable
                    columns={columns}
                    data={filteredDevices} // Pasar los dispositivos filtrados
                    pagination
                    highlightOnHover
                    striped
                    responsive
                />
            </div>
        );
    };

    export default DeviceTable;
