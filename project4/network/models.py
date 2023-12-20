from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Follower(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_following")
    follower = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_follower")

class Post(models.Model):
    post = models.TextField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField("User", related_name="user_likes")
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
    
    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "likes": self.likes.count(),
            "user_liked": [like.username for like in self.likes.all()],
            "post": self.post,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
        }