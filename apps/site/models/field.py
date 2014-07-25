from django.contrib.gis.db import models
from localground.apps.site.models import BaseAudit
from datetime import datetime
from localground.apps.lib.helpers import get_timestamp_no_milliseconds
	
class Field(BaseAudit):
	form = models.ForeignKey('Form')
	col_name_db = models.CharField(max_length=255, db_column="col_name")
	col_alias = models.CharField(max_length=255, verbose_name="column name")
	data_type = models.ForeignKey('DataType')
	display_width = models.IntegerField() #percentage
	
	#field to be displayed in viewer
	is_display_field = models.BooleanField(default=False)
	is_printable = models.BooleanField(default=True)
	has_snippet_field = models.BooleanField(default=True)
	
	#how the fields should be ordered in the data entry form:
	ordering = models.IntegerField()
	
	def can_view(self, user=None, access_key=None):
		return self.form.can_view(user=user, access_key=access_key)
			
	def can_edit(self, user):
		return self.form.can_edit(user)
	
	def can_manage(self, user):
		return self.form.can_manage(user)
	
	def to_dict(self):
		return dict(alias=self.col_alias, id=self.id)
	
	def __str__(self):
		return self.col_alias
	
	@property
	def col_name(self):
		import re
		# strip non-alpha-numeric characters (except spaces and dashes):
		tmp = re.sub(r'([^-^\s\w]|_)+', '', self.col_alias)
		
		#replace spaces and dashes with underscores:
		return str(re.sub(r'([-\s])+', '_', tmp).lower())
		
	class Meta:
		app_label = 'site'
		verbose_name = 'field'
		verbose_name_plural = 'fields'
		ordering = ['form__id', 'ordering']
		unique_together = (('col_alias', 'form'), ('col_name_db', 'form'))
		
	def save(self, user, *args, **kwargs):
		is_new = self.pk is None
		
		# 1. ensure that user doesn't inadvertently change the data type of the column    
		if is_new:
			self.owner = user
			self.date_created = get_timestamp_no_milliseconds()
			self.col_name_db = 'col_placeholder'
		else:
			o = Field.objects.get(id=self.pk)
			if o.data_type != self.data_type:
				raise Exception('You are not allowed to change the column type of an existing column')              
		
		self.last_updated_by = user 
		self.time_stamp = get_timestamp_no_milliseconds()    
		super(Field, self).save(*args, **kwargs)
		
		# 2. ensure that the column name is unique, and add column to table:
		if is_new:
			self.col_name_db = 'col_%s' % self.pk
			super(Field, self).save(*args, **kwargs)
			self.add_column_to_table()
			
		# 3. reset the application cache with the new table structure:
		from django.db.models.loading import cache
		from localground.apps.site.dynamic import ModelClassBuilder
		cache.app_models['site']['form_%s' % self.form.id] = ModelClassBuilder(self.form).model_class
	
	def add_column_to_table(self):
		if self.form.source_table_exists():
			from django.db import connection, transaction, DatabaseError
			from localground.apps.site.models import Snippet
			sql = []
			sql.append(
				'ALTER TABLE %s ADD COLUMN %s %s' %
				(self.form.table_name, self.col_name_db, self.data_type.sql)
			)
			#if self.has_snippet_field:
			sql.append(
				'ALTER TABLE %s ADD COLUMN %s_snippet_id integer' %
				(self.form.table_name, self.col_name_db)
			)
			sql.append('''
				ALTER TABLE %(table_name)s ADD CONSTRAINT %(table_name)s_%(column_name)s_fkey
				FOREIGN KEY(%(column_name)s)
				REFERENCES %(snippet_table)s(id) MATCH SIMPLE
				''' % dict(
						table_name=self.form.table_name,
						column_name='%s_snippet_id' % self.col_name_db,
						snippet_table=Snippet._meta.db_table
					)
			)
			
			# EXECUTE QUERY
			try:
				cursor = connection.cursor()
				for statement in sql:
					cursor.execute(statement)
				transaction.commit_unless_managed()
			
			except Exception as e:
				import sys
				sys.stderr.write('ERROR: %s' % e)
				transaction.rollback_unless_managed()
	
			
