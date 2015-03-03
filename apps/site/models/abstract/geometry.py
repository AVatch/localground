from django.contrib.gis.db import models
from localground.apps.site.models.abstract.base import Base


class BasePoint(Base):

    """
    abstract class for uploads with lat/lng references.
    """
    point = models.PointField(blank=True, null=True)

    @property
    def geometry(self):
        return self.point

    class Meta:
        abstract = True

    def display_coords(self):
        if self.point is not None:
            try:
                return '(%0.4f, %0.4f)' % (self.point.y, self.point.x)
            except ValueError:
                return 'String Format Error: (%s, %s)' % (
                    str(self.point.y), str(self.point.x))
        return '(?, ?)'

    def update_latlng(self, lat, lng, user):
        '''Tries to update lat/lng, returns code'''
        from django.contrib.gis.geos import Point
        try:
            if self.can_edit(user):
                self.point = Point(lng, lat, srid=4326)
                self.last_updated_by = user
                self.save()
                return ReturnCodes.SUCCESS
            else:
                return ReturnCodes.UNAUTHORIZED
        except Exception:
            return ReturnCodes.UNKNOWN_ERROR

    def remove_latlng(self, user):
        try:
            if self.can_edit(user):
                self.point = None
                self.last_updated_by = user
                self.save()
                return ReturnCodes.SUCCESS
            else:
                return ReturnCodes.UNAUTHORIZED
        except Exception:
            return ReturnCodes.UNKNOWN_ERROR

    def __unicode__(self):
        return self.display_coords()


class BaseExtents(Base):

    """
    abstract class for uploads with lat/lng references.
    """
    extents = models.PolygonField()
    northeast = models.PointField()
    southwest = models.PointField()
    center = models.PointField()
    zoom = models.IntegerField()

    class Meta:
        abstract = True

    def display_coords(self):
        if self.northeast is not None and self.southwest:
            try:
                return 'Northeast: (%0.4f, %0.4f), Southwest: (%0.4f, %0.4f)' % (
                    self.northeast.y, self.northeast.x, self.southwest.x, self.southwest.x)
            except ValueError:
                return 'String Format Error: (%s, %s)' % (
                    str(self.point.y), str(self.point.x))
        return '(?, ?)'

    def update_extents(self, northeast_lat, northeast_lng,
                       southwest_lat, southwest_lng, user):
        '''Tries to update lat/lng, returns code'''
        from django.contrib.gis.geos import Point
        try:
            if self.can_edit(user):
                self.northeast = Point(northeast_lng, northeast_lat, srid=4326)
                self.southwest = Point(southwest_lng, southwest_lat, srid=4326)
                self.last_updated_by = user
                self.save()
                return ReturnCodes.SUCCESS
            else:
                return ReturnCodes.UNAUTHORIZED
        except Exception:
            return ReturnCodes.UNKNOWN_ERROR

    def remove_extents(self, user):
        try:
            if self.can_edit(user):
                self.northeast = None
                self.southwest = None
                self.last_updated_by = user
                self.save()
                return ReturnCodes.SUCCESS
            else:
                return ReturnCodes.UNAUTHORIZED
        except Exception:
            return ReturnCodes.UNKNOWN_ERROR

    def __unicode__(self):
        return self.display_coords()


class ProcessingStatusCode(models.Model):
    READY_FOR_PROCESSING = 1
    PROCESSED_SUCCESSFULLY = 2
    PROCESSED_MANUALLY = 3
    ERROR_UNKNOWN = 4
    DIRECTORY_MISSING = 5
    PRINT_NOT_FOUND = 6
    QR_CODE_NOT_READ = 7
    QR_RECT_NOT_FOUND = 8
    MAP_RECT_NOT_FOUND = 9
    FORM_RECT_NOT_FOUND = 10
    FILE_WRITE_PRIVS = 11

    name = models.CharField(max_length=255)
    description = models.CharField(max_length=2000, null=True, blank=True)

    def __unicode__(self):
        return str(self.id) + ': ' + self.name

    class Meta:
        app_label = 'site'

    @classmethod
    def get_status(cls, code_id):
        return ProcessingStatusCode.objects.get(id=code_id)


class UploadSrc(models.Model):
    WEB_FORM = 1
    EMAIL = 2
    MANUAL = 3
    name = models.CharField(max_length=255)

    def __unicode__(self):
        return str(self.id) + '. ' + self.name

    class Meta:
        app_label = 'site'

    @classmethod
    def get_source(cls, source_id):
        return UploadSrc.objects.get(id=source_id)
