"""Local-only launcher; run explicitly by the player."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.request import urlopen
import threading
import webbrowser

root = Path(__file__).resolve().parent / 'dist'
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
port = 4173
try:
    server = ThreadingHTTPServer(('127.0.0.1', port), handler)
except OSError:
    try:
        with urlopen(f'http://127.0.0.1:{port}', timeout=2) as response:
            existing = response.read(8192).decode('utf-8', errors='replace')
        if 'Starfall Chronicle' in existing:
            webbrowser.open(f'http://127.0.0.1:{port}')
            print('游戏服务器已经运行，已在浏览器中打开。')
            raise SystemExit(0)
    except (OSError, ValueError):
        pass
    port = 4174
    server = ThreadingHTTPServer(('127.0.0.1', port), handler)
url = f'http://127.0.0.1:{port}'
print(f'游戏地址：{url}\n存档保存在浏览器中。请定期在设置中导出备份。')
threading.Timer(0.5, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\n旅途暂歇。下次再见。')
finally:
    server.server_close()
