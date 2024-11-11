
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3 as sql
from pysnmp.hlapi import *
from constantes import BASE_DATOS
import sqlite3 as sql
from flask_socketio import SocketIO, emit
import time
import json
import subprocess



app = Flask(__name__)


CORS(app, resources={r"/*": {"origins": "*"}})

app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")  # Permitir cualquier origen para WebSockets
community = 'public'  # Comunidad SNMP
oid_descripcion_sistema = '1.3.6.1.2.1.1.1.0'
oid_nombre_sistema = '1.3.6.1.2.1.1.5.0'
oid_tiempo_actividad = '1.3.6.1.2.1.1.3.0'
#mis flags
task_running = False
snmp_in_progress = False


#Función para realizar la consulta SNMP
def consulta_snmp(host, community, oid):
    iterator = getCmd(
        SnmpEngine(),
        CommunityData(community, mpModel=1),  
        UdpTransportTarget((host, 161), timeout=5, retries=1),  
        ContextData(),
        ObjectType(ObjectIdentity(oid))
    )
    
    errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
    if errorIndication:
        return {"error": str(errorIndication)}
    elif errorStatus:
        return {"error": errorStatus.prettyPrint()}
    else:
        result = {}
        for varBind in varBinds:
            oid_str = '.'.join([str(x) for x in varBind[0].prettyPrint()])
            result[oid_str] = str(varBind[1])
        return result
    

def get_devices():
    conn = sql.connect(BASE_DATOS)
    instruccion = "SELECT * FROM Devices"
    cursor = conn.cursor()
    cursor.execute(instruccion)
    column_names = [description[0] for description in cursor.description]
    resultados = cursor.fetchall()
    
    json_data = []
    for row in resultados:
        device_data = dict(zip(column_names, row))
        json_data.append(device_data)
    conn.close()
    return json_data


@app.route("/api/obtener_dispositivos", methods=['GET'])
def obtener_dispotivos():
    devices = get_devices()
    return jsonify(devices)


@socketio.on('connect')
def test_connect():
    print('Cliente conectado mediante WebSocket')
    
@socketio.on('disconnect')
def test_disconnect():
    print('Cliente desconectado')
    
@socketio.on('enviar_device_info')
def handle_device_info(data):
    device_name = data.get('DeviceName')
    device_description = data.get('DeviceDescripcion')
    device_ip = data.get('DeviceIP')
    device_index = data.get('index')
    if device_ip:
        device_data = {
            "name": device_name,
            "description": device_description,
            "ip": device_ip,
            "index": device_index,
            "status": False  # Status por defecto es False (Offline)
        }
        print("--------------------------------------")
        print(f"Haciendo consulta de {device_ip}")
        print("--------------------------------------")
        try:
            start_time = time.time()
            snmp_response = consulta_snmp(device_ip, community, oid_tiempo_actividad)
            print(snmp_response)
            if "error" in snmp_response:
                
                host = device_ip  
                packet = 4  
                print(f"Error en consulta SNMP para {device_ip}: {snmp_response['error']}  se procede a hacer ping")
                ping = subprocess.getoutput(f"ping -n {packet} {host}") 
                if "TTL=" in ping:
                    print("El ping fue exitoso.")
                    device_data['status'] =   True
                    
                else:
                    print("No se pudo hacer ping al host.")
                    device_data['status'] =   False
                print(f"Error en consulta SNMP para {device_ip}: {snmp_response['error']}")
            else:
                device_data['status'] = True  # El dispositivo está Online
                print(f"Dispositivo {device_ip} está Online")
        
        except Exception as e:
            device_data['status'] = False
            print(f"Error consultando {device_ip}: {str(e)}")
        # Emitir la respuesta solo al cliente que envió los datos
        emit('respuesta_device_info', device_data, room=request.sid)
        print(f"Consulta SNMP completa para el dispositivo {device_index}")
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f"La consulta  tomó {elapsed_time:.2f} segundos para {device_ip}")
        print("---------------------------------------------------------------")

    else:
        emit('respuesta_device_info', {"error": "No IP provided"}, room=request.sid)


@app.route('/api/devices', methods=['POST'])
def add_device():
    data = request.json  
    conn = sql.connect(BASE_DATOS)  
    status = "Conectando"
    device_name = data.get('deviceName')
    device_ip = data.get('deviceIP')
    device_description = data.get('deviceDescription')
    instruccion= (f"INSERT INTO Devices VALUES ('{device_name}', '{device_ip}', '{device_description}', '{status}')")
    cursor = conn.cursor()
    cursor.execute(instruccion)
    conn.commit()
    conn.close()
    print("Datos recibidos:", data)
    return jsonify({"message": "Dispositivo registrado exitosamente!"}), 201

if __name__ == "__main__":
    socketio.run(app, debug=True, host='localhost', port=8080)



