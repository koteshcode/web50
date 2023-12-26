from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Verb(models.Model):
    verb = models.TextField()
    forms = models.TextField()
    freq = models.IntegerField(default=1)