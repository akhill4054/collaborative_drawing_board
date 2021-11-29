import socketio

from board.models import Board
from utils.model_helpers import get_or_none


# set async_mode to 'threading', 'eventlet', 'gevent' or 'gevent_uwsgi' to
# force a mode else, the best mode is selected automatically from what's
# installed
async_mode = 'eventlet'

sio = socketio.Server(async_mode=async_mode, cors_allowed_origins='*')


@sio.on('connect', namespace='/board')
def connect_handler(sid, environ):
    print('** Connection established:', sid)


@sio.on('enter_session', namespace='/board')
def enter_session(sid, data):
    # Authenticate user
    session_id = data['session_id']
    user_session_key = data['user_session_key']

    board = get_or_none(Board, session_id=session_id)

    def helper_join_board(name, is_host=False):
        # Save session.
        sio.save_session(sid, {
            'username': user_session_key,
            'room': session_id,
            'is_host': is_host,
        }, namespace='/board')
        # Let the user join the room.
        sio.enter_room(sid, session_id, namespace='/board')
        sio.emit('join', {
            "u": user_session_key,
            "n": name,
            "is_host": is_host,
        }, room=session_id, namespace='/board', skip_sid=sid)
        
        members = [
            {
                'u': board.host_session_key,
                'n': board.host_name,
                'is_host': True,
            }
        ]
        for member in board.member_set.all():
            members.append({
                'u': member.user_session_key,
                'n': member.name,
            })
        
        return {
            'type': 'success', 
            'msg': 'Joined the room as %s. :)' % ('host' if is_host else 'a member'),
            'members': members,
        }

    if board:
        if board.host_session_key == user_session_key:
            # Host joined.
            return helper_join_board(is_host=True, name=board.host_name)
        try:
            member = board.member_set.get(user_session_key=user_session_key)
            # Member joined.
            return helper_join_board(is_host=False, name=member.name)
        except:
            return {'type': 'error', 'msg': 'Invalid credentials!'}
    else:
        return {'type': 'error', 'msg': 'Either the session has been ended or invalid session URL.'}


def has_host_privilages(sid):
    res = {'is_host': False}
    try:
        user_socket_session = sio.get_session(sid, namespace='/board')
        res['user_socket_session'] = user_socket_session
        res['is_host'] = True
    except:
        print('Session not found for user with sid:', sid)
    return res


@sio.on('draw', namespace='/board')
def draw(sid, data):
    try:
        user_socket_session = sio.get_session(sid, namespace='/board')
        sio.emit('draw', data, room=user_socket_session['room'], skip_sid=sid, namespace='/board')
    except:
        print('Session not found for user with sid:', sid)


@sio.on('clear-board', namespace='/board')
def clear_board(sid):
    res = has_host_privilages(sid)
    if res:
        data = { 'u': res.user_socket_session['username'], }
        sio.emit('clear-board', data, room=res.user_socket_session['room'], namespace='/board')


@sio.on('end-session', namespace='/board')
def end_session(sid):
    res = has_host_privilages(sid)
    if res:
        user_socket_session = res['user_socket_session']
        data = { 'msg': 'Session ended by the host.', }

        sio.emit('session-ended', data, room=user_socket_session['room'], skip_sid=sid, namespace='/board')
        
        return 'Ok'
    else:
        return None


@sio.on('leave', namespace='/board')
def leave_room(sid):
    try:
        user_socket_session = sio.get_session(sid, namespace='/board')
        data = { 'u': user_socket_session['username'], }
        
        sio.emit('leave', data, room=user_socket_session['room'], namespace='/board')
        sio.leave_room(sid, user_socket_session['room'])
        
        return 'Ok'
    except:
        print('Session not found for user with sid:', sid)
        return None
