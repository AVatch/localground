from django import test
from localground.apps.site.views import prints, profile
from localground.apps.site import models
from localground.apps.site.tests import ViewMixin
from rest_framework import status
	
class PrintViewTest(test.TestCase, ViewMixin):
	def setUp(self):
		ViewMixin.setUp(self)
		self.urls = ['/maps/print/']
		self.view = prints.generate_print
		
class PrintProfileTest(test.TestCase, ViewMixin):
	def setUp(self):
		ViewMixin.setUp(self)
		self.urls = ['/profile/prints/']
		self.view = profile.object_list_form