from django.urls import path
from . import views


urlpatterns = [
    path('create/', views.create_board, name="create"),
    path('join/', views.enter_session_id, name="enter_session_id"),
    path('join/<path:session_id>/', views.join_board, name="join_board"),
    path('<uuid:session_id>/', views.live_board, name="join_board"),
]
