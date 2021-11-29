import uuid
from django.db import models
from django.contrib.auth.hashers import make_password

# Create your models here.
class Board(models.Model):
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=100)
    host_name = models.CharField(max_length=50)
    host_session_key = models.TextField()
    password = models.CharField(max_length=10)
    
    class Meta:
        indexes = [
            models.Index(fields=['host_session_key'])
        ]
    
    @classmethod
    def create(cls, title, host_name, password, host_session_key):
        password = make_password(password)
        return cls(
            title=title,
            host_name=host_name,
            password=password,
            host_session_key=host_session_key
        )


class Member(models.Model):
    name = models.CharField(max_length=100)
    user_session_key = models.TextField(primary_key=True)
    board = models.ForeignKey(Board, on_delete=models.CASCADE)

    class Meta:
        indexes = [
            models.Index(fields=['user_session_key'])
        ]