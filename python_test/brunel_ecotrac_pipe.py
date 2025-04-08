## Python Code
### Server (server.py)

import socket

# server_sockets = {}
# socketCount = 0

# class BrunelEcotracSocketMaster:
#     def __init__(self, portNumber):

#         self.host = host = '127.0.0.1'
#         self.port = port = portNumber

#         # Create socket object
#         self.server_socket = server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

#         # Bind the socket to the port
#         socket.bind((host, port))

#         # Listen for incoming connections
#         socket.listen(1)
#         print(f'Server listening on {host}:{port}')

#         while True:
#         # Wait for a connection
#             connection, client_address = server_socket.accept()
#             print(f'Connected by {client_address}')
#             socketCount += 1
#             # Send message to client
#             connection.sendall(b'PORT:' + int( portNumber + socketCount));

#         # Receive message from client
#         (data, address) = connection.recvfrom(1024)
#         print(f'Received from client {address}: {data.decode()}')

#         # Close the connection
#         connection.close()

# def start_server(port):
#     return

# if __name__ == '__main__':
#     start_server()


### Client (client.py)

def start_client():
    host = '127.0.0.1'
    port = 8080

    # Create socket object
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Connect to the server
    client_socket.connect((host, port))
    print(f'Connected to {host}:{port}')

    # Receive message from server
    data = client_socket.recv(1024)
    print(f'Received from server: {data.decode()}')

    # Send message to server
    client_socket.sendall(b'Hello from client!')

    # Close the connection
    client_socket.close()

if __name__ == '__main__':
    start_client()

# First, open a link to 8080 and request a port number

