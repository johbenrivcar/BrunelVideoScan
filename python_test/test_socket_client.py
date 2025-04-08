# Echo client program
import socket
import asyncio

HOST = '127.0.0.1'    # The remote host
PORT = 50007              # The same port as used by the server
server = None
sock = None

async def receiveMessages():
    print("Entered receiveMessages() with sock set to")
    print( sock )
    while True:
        print("waiting for data from sock")
        data = sock.recv(1024)
        print("data received from sock")
        msg = data.decode("utf-8")
        print('Received', msg)
        if msg[0:4] == "END:":
            print("END: message was found")
            break
        print("Sending another message to client")
        sock.sendall(b'Hello, world from client, again')
    return

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    sock = s
    s.connect((HOST, PORT))
    print("Connected, start sending messages to server")
    sock.sendall(b'Hello, world from client')
    aProc = asyncio.run( receiveMessages() )

    