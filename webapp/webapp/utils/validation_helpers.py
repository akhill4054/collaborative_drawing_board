from ..models import Board
from django.core.exceptions import ValidationError


def validate_session(session_id):
    error_messages = []
    board = None
    try:
        board = Board.objects.get(pk=session_id)
    except Board.DoesNotExist:
        error_messages.append('No session exists with the provided id!')
    except ValidationError:
        error_messages.append('Invalid session id!')
    except:
        error_messages.append(
            'Something went wrong, please try again after some time.')
    return {
        'is_valid': board != None,
        'board': board,
        'error_messages': error_messages,
    }