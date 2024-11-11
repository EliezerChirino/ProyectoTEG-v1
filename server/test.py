from pysnmp.hlapi import *

def consulta_snmp(host, community, oid):
    iterator = getCmd(
        SnmpEngine(),
        CommunityData(community, mpModel=1),  # SNMPv2c
        UdpTransportTarget((host, 161), timeout=10, retries=3),  # Aumentamos el timeout y los reintentos
        ContextData(),
        ObjectType(ObjectIdentity(oid))
    )
    
    errorIndication, errorStatus, errorIndex, varBinds = next(iterator)

    if errorIndication:
        print(f"Error: {errorIndication}")
    elif errorStatus:
        print(f"Error en el OID: {errorStatus.prettyPrint()}")
    else:
        for varBind in varBinds:
            print(f'{varBind[0]} = {varBind[1]}')

# Ejemplo de uso
host = '10.10.1.254'  # IP de la laptop Lenovo
community = 'corimonro'  # Comunidad SNMP

# OID para la descripción del sistema
oid_descripcion_sistema = '1.3.6.1.2.1.1.1.0'  
# OID para el nombre del sistema
oid_nombre_sistema = '1.3.6.1.2.1.1.5.0'
# OID para el tiempo de actividad del sistema
oid_tiempo_actividad = '1.3.6.1.2.1.1.3.0'

print("Descripción del sistema:")
consulta_snmp(host, community, oid_descripcion_sistema)

print("\nNombre del sistema:")
consulta_snmp(host, community, oid_nombre_sistema)

print("\nTiempo de actividad del sistema:")
consulta_snmp(host, community, oid_tiempo_actividad)



"""import subprocess

def main():
    host = input("Enter Host: ")
    packet = int(input("\nEnter Packet: "))
    print("\n")
    ping = subprocess.getoutput(f"ping -w {packet} {host}")
    print(ping)

main()"""


"""import subprocess

def main():
    host = "10.10.2.91"  
    packet = 4  
    print(f"Enviando {packet} paquetes a {host}...\n")
    
    
    ping = subprocess.getoutput(f"ping -n {packet} {host}") 
    
    
    print(ping)

main()"""
