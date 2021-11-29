from django.shortcuts import render
from board.models import Board

# Create your views here.
def index(request):
    online_users = len(Board.objects.all())
    return render(request, 'index.html', {
        'online_users': online_users,
    })

def features(request):
    return render(request, 'index.html')

def about(request):
    return render(request, 'index.html')
