from django.db import models

class Stop(models.Model):
  id = models.IntegerField(primary_key=True, unique=True)
  name = models.CharField(max_length=255)
  lat = models.FloatField()
  lng = models.FloatField()

  def __str__(self):
    return '{0} {1}'.format(self.id, self.name)
