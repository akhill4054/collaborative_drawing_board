"""
WSGI config for webapp project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application
from django.contrib.staticfiles.handlers import StaticFilesHandler
from socketio.middleware import Middleware
from websocket.app import sio
import eventlet
import eventlet.wsgi


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webapp.settings')

dajngo_app = get_wsgi_application()
dajngo_app = StaticFilesHandler(dajngo_app)
application = Middleware(sio, dajngo_app)
eventlet.wsgi.server(eventlet.listen(('', 8000)), application)
