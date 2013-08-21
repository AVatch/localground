from localground.apps.site.api.serializers.base_serializer import BaseSerializer
from localground.apps.site.widgets import SnippetWidget, CustomDateTimeWidget
from localground.apps.site.api import fields
from rest_framework import serializers
from localground.apps.site import models
from django.forms import widgets
from django.conf import settings

class FormSerializer(BaseSerializer):
	project_id = fields.ProjectField(label='project_id', source='project', required=False)
	data_url = serializers.SerializerMethodField('get_data_url')
	class Meta:
		model = models.Form
		fields = BaseSerializer.Meta.fields + ('project_id', 'data_url')
		depth = 0
		
	def get_data_url(self, obj):
		return '%s/api/0/forms/%s/data/' % (settings.SERVER_URL, obj.pk)


from rest_framework import serializers
from localground.apps.site import widgets, models
from localground.apps.site.api import fields

class BaseRecordSerializer(serializers.ModelSerializer):
	point = fields.PointField(help_text='Assign lat/lng field',
							  widget=widgets.PointWidgetTextbox,
							  required=False)
	overlay_type = serializers.SerializerMethodField('get_overlay_type')
	url = serializers.SerializerMethodField('get_detail_url')
		
	class Meta:
		fields = ('id', 'overlay_type', 'url', 'point', 'manually_reviewed')
		read_only_fields = ('manually_reviewed',)
		
	def get_overlay_type(self, obj):
		return obj._meta.verbose_name
	
	def get_detail_url(self, obj):
		return '%s/api/0/forms/%s/data/%s/' % (settings.SERVER_URL,
					obj.form.id, obj.id)

class DynamicFormDataSerializerBuilder(object):
	
	def __init__(self, form):
		self.form = form
		self._serializer = None

	@property
	def SerializerClass(self):
		if self._serializer is None:
			self._serializer = self._create_serializer()
		return self._serializer
	
	def _create_serializer(self):
		"""
		generate a dynamic serializer from dynamic model
		"""
		form_fields = []
		form_fields.append(self.form.get_num_field())
		form_fields.extend(list(self.form.get_fields()))
		
		field_names = [f.col_name for f in form_fields]
				
		class FormDataSerializer(BaseRecordSerializer):
			class Meta:
				from django.forms import widgets
				model = self.form.TableModel
				fields = BaseRecordSerializer.Meta.fields + tuple(field_names)
				read_only_fields = BaseRecordSerializer.Meta.read_only_fields
				
		return FormDataSerializer
	

def create_compact_serializer(form):
	"""
	generate a dynamic serializer from dynamic model
	"""
	col_names = [f.col_name for f in form.get_fields()]
	
	class FormDataSerializer(BaseRecordSerializer):
		recs = serializers.SerializerMethodField('get_recs')
		url = serializers.SerializerMethodField('get_detail_url')
		project_id = serializers.SerializerMethodField('get_project_id')
			
		class Meta:
			model = form.TableModel
			fields = ('id', 'num', 'recs', 'url', 'point', 'project_id')
			
		def get_recs(self, obj):
			return [getattr(obj, col_name) for col_name in col_names]
		
		def get_detail_url(self, obj):
			return '%s/api/0/forms/%s/data/%s/' % (settings.SERVER_URL,
						obj.form.id, obj.id)
		def get_project_id(self, obj):
			return obj.form.project.id

	return FormDataSerializer
	
