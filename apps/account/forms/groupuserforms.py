#!/usr/bin/env python
from django.forms import ModelForm, fields, formsets, HiddenInput, models
from localground.apps.helpers.widgets import UserAutocomplete
from django.contrib.auth.models import User
from localground.apps.account.models import Project
from django.contrib.contenttypes import generic
from django.conf import settings

class UserAuthorityObjectForm(ModelForm):
    user = models.ModelChoiceField(queryset=User.objects.all(), widget=UserAutocomplete)
    id = fields.CharField(widget=HiddenInput)
    class Meta:
        from localground.apps.account.models import UserAuthorityObject
        name = 'form'
        model = UserAuthorityObject
        fields = ('id', 'user', 'authority', 'object_id', 'content_type')
    
    class Media:
        js = ('http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.8/jquery-ui.min.js',)
        css = {
            'all': ('/%s/css/themes/bootstrap/jquery-ui-1.8.16.custom.css' % settings.STATIC_MEDIA_DIR,)
        }
        
    def __init__(self, *args, **kwargs):
        """
        We need access to the county field in the municipality widget, so we
        have to associate the form instance with the widget.
        """
        super(UserAuthorityObjectForm, self).__init__(*args, **kwargs)
        self.fields['user'].widget.form_instance = self

