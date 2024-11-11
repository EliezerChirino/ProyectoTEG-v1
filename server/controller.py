import sqlite3 as sql

def createBD():
    conn= sql.connect(r"C:\\Users\\Eliezer Chirino\\OneDrive\\Escritorio\\proyecto-teg\\server\\BD\\Dispositivosssssssssss.db" )
    conn.commit()
    conn.close()


def createTable():
    conn = sql.connect(r"C:\\Users\\Eliezer Chirino\\OneDrive\\Escritorio\\proyecto-teg\\server\\BD\\Dispositivosssssssssss.db")
    cursor = conn.cursor()
    cursor.execute(
    """
    CREATE TABLE Devices(
        DeviceName VARCHAR, 
        DeviceIP VARCHAR, 
        DeviceDescripcion VARCHAR
    )
    """
    )
    conn.commit()
    conn.close()

createTable()