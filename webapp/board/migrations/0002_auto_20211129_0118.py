# Generated by Django 3.2.9 on 2021-11-28 19:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('board', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='member',
            name='id',
        ),
        migrations.AlterField(
            model_name='member',
            name='user_session_key',
            field=models.TextField(primary_key=True, serialize=False),
        ),
    ]
