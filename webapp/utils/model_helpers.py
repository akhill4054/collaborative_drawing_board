from django.shortcuts import render


def get_or_none(model, **kwargs):
    try:
        return model.objects.get(**kwargs)
    except:
        return None
