from django.core.files.storage import get_storage_class
from storages.backends.s3boto import S3BotoStorage

class StaticStorage(S3BotoStorage):
    location = 'static'

class MediaStorage(S3BotoStorage):
    location = 'media'

class CachedS3BotoStorage(S3BotoStorage):
    """
    S3 storage backend that saves the files locally, too.
    """
    def __init__(self, *args, **kwargs):
        super(CachedS3BotoStorage, self).__init__(*args, **kwargs)
        self.local_storage = get_storage_class(
            "compressor.storage.CompressorFileStorage")()

    def save(self, name, content):
        self.local_storage._save(name, content)
        super(CachedS3BotoStorage, self).save(name, self.local_storage._open(name))
        return name