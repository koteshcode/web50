from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Verb(models.Model):
    verb = models.TextField()
    forms = models.TextField()
    freq = models.IntegerField(default=1)

class VerbScore(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verb_score")
    verb_id = models.ForeignKey(Verb, on_delete=models.CASCADE, related_name="user_stats")
    is_first = models.BooleanField(default=False)
    hint = models.PositiveIntegerField(default=0)
    repeat = models.PositiveIntegerField(default=0)
    score = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)


    def increment_repeat(self):
        self.repeat += 1
        self.save()

    def increment_hint(self):
        self.hint += 1
        self.save()
    
    def serialize(self):
        return {
            "user": self.user_id.username,
            "is_first": self.is_first,
            "hint": self.hint,
            "repeat": self.repeat,
            "score": self.score,
            "verbs": self.verb_id.verb,
        }