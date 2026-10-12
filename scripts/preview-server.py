"""Local development server: revalidate modules instead of retaining old code."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


parser = argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=4174)
parser.add_argument("--directory", default=".")
args = parser.parse_args()
server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(PreviewHandler, directory=args.directory))
print(f"Preview: http://localhost:{args.port}", flush=True)
server.serve_forever()
