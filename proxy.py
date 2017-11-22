from http.server import HTTPServer
from http.server import BaseHTTPRequestHandler
from http.client import HTTPConnection
from urllib.parse import urlparse
import json
import base64


class RequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH')
        self.send_header('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,User-Agent,X-Requested-With,If-Modified-Since,Content-Type,X-Droi-AppID,X-Droi-Api-Key,X-Droi-Service-AppID,X-Droi-UID,X-Droi-TS,X-Droi-ID,X-Droi-DeviceID,X-Droi-ZC,X-Droi-Session-Token,X-Droi-Role,Cache-Control,X-Path,X-Method')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def do_POST(self):
        return self.proxy()

    def proxy(self):
        length = int(self.headers["Content-Length"])
        method = self.headers["X-Method"]
        url = self.headers["X-Path"]
        data = json.loads(self.rfile.read(length))
        body = None
        if 'Body' in data:
            body = base64.b64decode(data['Body'])
        header = {}
        if 'Header' in data:
            header = data['Header']

        urls = urlparse(url)

        if len(urls.query) > 0:
            url = urls.path + "?" + urls.query
        else:
            url = urls.path

        print('net %s' % (urls.netloc))
        print('%s, %s' % (method, url))
        print(body)
        print(header)
        conn = HTTPConnection(urls.netloc)
        conn.request(method, url, body, header)
        resp = conn.getresponse()

        print('code %d' % (resp.code))
        self.send_response(resp.code)
        acceptHeader = ''
        for h in resp.getheaders():
            if h[0] == 'Content-Length' or h[0] == 'Content-Type' or h[0] == 'Connection' or h[0] == 'Transfer-Encoding':
                continue
            print(h[0] + ": " + h[1])
            acceptHeader = acceptHeader + h[0] + ','
            self.send_header(h[0], h[1])

        outdata = resp.read()
        print('Content-Length: %d' % (len(outdata))) 
        print('Accept: ' + acceptHeader[:-1]+',Content-Length,Content-Type')
        print(outdata)
        self.send_header('Connection', 'close')
        self.send_header('Content-Length', str(len(outdata)))
        self.send_header('Content-Type', 'application/octet-stream')
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header('Access-Control-Expose-Headers', acceptHeader[:-1]+',Content-Length,Content-Type,Connection') 
        self.end_headers()
        self.wfile.write(outdata)
        conn.close()


def main():
    httpd = HTTPServer(('', 5432), RequestHandler)
    print('HTTP server started, binded port 5432')
    httpd.serve_forever()

if __name__ == '__main__':
    main()
