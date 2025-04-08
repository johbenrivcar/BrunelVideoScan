# Echo server program
import socket

HOST = '127.0.0.1'                 # Symbolic name meaning all available interfaces
PORT = 50007              # Arbitrary non-privileged port
msgCount = 0
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen(1)
    conn, addr = s.accept()
    with conn:
        print('Connected by', addr)
        while True:
            data = conn.recv(1024)
            msgCount += 1
            if not data: break
            conn.sendall(data)
            conn.sendall(b'Additional message from server//')
            print("Message count is " + str(msgCount))
            if msgCount == 10:
                print("Sending stop message to client")
                conn.sendall(b'END: Stop execution of client//')