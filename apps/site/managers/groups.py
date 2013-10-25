from django.contrib.gis.db import models
from django.db.models.query import QuerySet
from localground.apps.site.managers.base import GroupMixin
from localground.apps.site.managers.base import GenericLocalGroundError
from django.db.models import Q

class ProjectMixin(GroupMixin):
    def to_dict_list(self):
        # does this need to be implemented, or can we just rely on
        # the ProjectSerializer in the API?
        return []
    
class ProjectQuerySet(QuerySet, ProjectMixin):
    pass

class ProjectManager(models.GeoManager, ProjectMixin):
    def get_query_set(self):
        return ProjectQuerySet(self.model, using=self._db)
            
class ViewMixin(GroupMixin):
    def to_dict_list(self):
        # does this need to be implemented, or can we just rely on
        # the ViewSerializer in the API?
        return []
    
class ViewQuerySet(QuerySet, ViewMixin):
    pass

class ViewManager(models.GeoManager, ViewMixin):
    def get_query_set(self):
        return ViewQuerySet(self.model, using=self._db)
    
class FormMixin(GroupMixin):
    # For now, only the owner can view / edit a form.
    # Todo: restrict viewing data to the row-level, based on project
    # permissions.
    related_fields = ['owner', 'last_updated_by']
    prefetch_fields = ['users__user', 'projects', 'field_set']
    
    def my_forms(self, user=None):
        # a form is associated with one or more projects
        return self.model.objects.distinct().filter(
                Q(owner=user)
            ).order_by('name',)
    
    def all_forms(self):
        return self.model.objects.all().order_by('name',)
    
    def _get_objects(self, user, authority_id, project=None, request=None,
                    context=None, ordering_field='-time_stamp'
                    ):
    
        if user is None or not user.is_authenticated():
            raise GenericLocalGroundError('The user cannot be empty')
            
        q = self.model.objects.distinct().select_related(*self.related_fields)
        q = q.filter(
                Q(owner=user) |
                (
                    Q(users__user=user) &
                    Q(users__authority__id__gte=authority_id)
                ) |
                Q(projects__owner=user) |
                (
                    Q(projects__users__user=user) &
                    Q(projects__users__authority__id__gte=authority_id)
                )
            )
        
        if request:
            q = self._apply_sql_filter(q, request, context)
        q = q.prefetch_related(*self.prefetch_fields)
        q =  q.order_by(ordering_field)
        return q
    
    
    def get_objects(self, user, project=None, request=None,
                    context=None, ordering_field='-time_stamp'):
        return self._get_objects(
            user, 1, project=project, request=request,
            context=context, ordering_field=ordering_field
        )
    
    def get_objects_editable(self, user, project=None, request=None,
                    context=None, ordering_field='-time_stamp'):
        return self._get_objects(
            user, 2, project=project, request=request,
            context=context, ordering_field=ordering_field
        )
    
    
    
    def get_objects_public(self, access_key=None, request=None, context=None,
                    ordering_field='-time_stamp', **kwargs):
        
        from localground.apps.site.models import ObjectAuthority
        
        # condition #1: check if forms have been shared directly:
        c1 =(
                (
                    Q(access_authority__id=ObjectAuthority.PUBLIC_WITH_LINK)
                    &
                    Q(access_key=access_key)
                ) |
                Q(access_authority__id=ObjectAuthority.PUBLIC)
            )
        
        # condition #2: check if any of the projects associated with
        #               forms have been shared (which means that the form
        #               has been indirectly shared)
        c2 =(
                (
                    Q(projects__access_authority__id=ObjectAuthority.PUBLIC_WITH_LINK)
                    &
                    Q(projects__access_key=access_key)
                ) |
                Q(projects__access_authority__id=ObjectAuthority.PUBLIC)
            )    
                
        q = self.model.objects.distinct().select_related(*self.related_fields)
        q = q.filter(c1 | c2)
        if request is not None:
            q = self._apply_sql_filter(q, request, context)
        q = q.prefetch_related(*self.prefetch_fields)
        if ordering_field:
            q =  q.order_by(ordering_field)
        return q

class FormQuerySet(QuerySet, FormMixin):
    pass        

class FormManager(models.GeoManager, FormMixin):
    def get_query_set(self):
        return FormQuerySet(self.model, using=self._db)
    
    
    