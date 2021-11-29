from django.http.response import HttpResponse
from django.shortcuts import render
from django.http import HttpResponseRedirect
from .models import Board, Member
from django.contrib.auth.hashers import check_password
from .utils.validation_helpers import validate_session
from utils.validate import is_all_non_null_and_non_empty, is_non_null_and_non_empty
from utils.model_helpers import get_or_none

# Create your views here.
def create_board(request):
    if request.method == 'POST':
        host_name = request.POST.get('inputHostName', None)
        session_title = request.POST.get("inputSessionTitle", None)
        session_password = request.POST.get("inputSessionPassword", None)

        error_messages = []

        # Save user session.
        request.session.save()

        if not request.session.session_key:
            error_messages.append('Session key not found, please try again.')
        elif is_all_non_null_and_non_empty([host_name, session_title, session_password]):
            if len(session_password) < 6:
                error_messages.append(
                    "Password must be at least 6 characters long!")
            else:
                # Create a new board.
                board = Board.create(
                    title=session_title,
                    host_name=host_name,
                    password=session_password,
                    host_session_key=request.session.session_key
                )
                board.save()
                return HttpResponseRedirect('/board/%s/' % board.session_id)
        else:
            error_messages.append("Invalid form submission!")

        return render(
            request,
            'create.html',
            {
                'error_messages': error_messages,
                'host_name': host_name,
                'session_title': session_title,
                'session_password': session_password,
            }
        )
    else:
        return render(request, 'create.html')


def enter_session_id(request):
    error_messages = []

    input_session_id = None

    if request.method == 'POST':
        input_session_id = request.POST.get('inputSessionId', None)

        if not is_non_null_and_non_empty(input_session_id):
            error_messages.append('Session id cannot be empty!')
        else:
            session_validation = validate_session(input_session_id)
            if session_validation['is_valid']:
                # Save user session.
                request.session.save()

                if (session_validation['board'].host_session_key == request.session.session_key
                        or get_or_none(session_validation['board'].member_set, user_session_key=request.session.session_key)):
                    # Already host/member in the live session.
                    return HttpResponseRedirect('/board/%s/' % session_validation['board'].session_id)

                # Redirect to enter deatils form.
                return HttpResponseRedirect('/board/join/%s/' % input_session_id)
            else:
                error_messages.extend(session_validation['error_messages'])

    return render(request, 'enter_session_id.html', {
        'input_session_id': input_session_id,
        'error_messages': error_messages
    })


def join_board(request, session_id):
    error_messages = []

    session_validation = validate_session(session_id)

    # Save user session.
    request.session.save()

    if session_validation['is_valid']:
        if (session_validation['board'].host_session_key == request.session.session_key
                or get_or_none(session_validation['board'].member_set, user_session_key=request.session.session_key)):
            # Already host/member in the live session.
            return HttpResponseRedirect('board/%s/' % session_validation['board'].session_id)

        input_member_name = None
        input_session_password = None

        if request.method == 'POST':
            input_member_name = request.POST.get('inputMemberName', None)
            input_session_password = request.POST.get(
                'inputSessionPassword', None)

            if not is_all_non_null_and_non_empty([input_member_name, input_session_password]):
                error_messages.append('Invalid form data!')
            elif len(input_member_name) < 4:
                error_messages.append(
                    'Name must be atleast 4 characters long!')
            else:
                # Validate password.
                if check_password(input_session_password, session_validation['board'].password):
                    Member(
                        name=input_member_name,
                        user_session_key=request.session.session_key,
                        board=session_validation['board']
                    ).save()
                    return HttpResponseRedirect('/board/%s/' % (session_id))
                else:
                    input_session_password = None
                    error_messages.append('Invalid password!')

        return render(request, 'join.html', {
            'input_member_name': input_member_name,
            'input_session_password': input_session_password,
            'error_messages': error_messages
        })
    else:
        error_messages.extend(session_validation['error_messages'])
        # Redirect to enter session id page.
        return HttpResponseRedirect('/board/join/')


def live_board(request, session_id):
    error_messages = []

    board = get_or_none(Board, session_id=session_id)
    user_session_key = request.session.session_key

    if not board:
        error_messages.append('Session ended.')
    if not user_session_key:
        error_messages.append('User session not found, please rejoin the session.')

    return render(request, "board.html", {
            'session_title': board.title,
            'session_id': board.pk,
            'user_session_key': request.session.session_key,
            'is_host': user_session_key == board.host_session_key,
        })
