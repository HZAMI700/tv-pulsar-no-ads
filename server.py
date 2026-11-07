import os
import sys
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/svg+xml", ".svg")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB_DIR = os.path.join(BASE_DIR, "web")
ASSETS_DIR = os.path.join(BASE_DIR, "app", "src", "main", "assets")
ICON_PATH = os.path.join(BASE_DIR, "pulsar_tv_app_icon_512_transparent.png")

class PulsarHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Strip query string
        path = path.split('?', 1)[0].split('#', 1)[0]
        
        if path == "/app_icon.png":
            return ICON_PATH
        
        rel = path.lstrip('/')
        if not rel:
            rel = "index.html"
            
        dist_path = os.path.join(WEB_DIR, "dist", rel)
        if os.path.exists(dist_path):
            return dist_path

        if path.startswith("/assets/"):
            rel_path = path[len("/assets/"):]
            return os.path.join(ASSETS_DIR, rel_path)

        if path.startswith("/logos/"):
            rel_path = path[len("/logos/"):]
            return os.path.join(ASSETS_DIR, "logos", rel_path)
            
        return os.path.join(WEB_DIR, rel)

    def end_headers(self):
        # Enable CORS and disable caching during dev
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

def run(port=8080):
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, PulsarHandler)
    print(f"Pulsar TV Web Server active at http://localhost:{port}/")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run(port)
