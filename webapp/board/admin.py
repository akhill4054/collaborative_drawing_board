from django.contrib import admin
from .models import Board

# Register your models here.
class BoardAdmin(admin.ModelAdmin):
    pass
admin.site.register(Board, BoardAdmin)