from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Item(models.Model):
    is_active = models.BooleanField(default=True)
    title = models.CharField(max_length=64)
    image_url = models.URLField(blank=True)
    description = models.TextField(max_length=200)
    category = models.CharField(max_length=16, blank=True)
    bid = models.DecimalField(decimal_places=2, max_digits=10)
    seller = models.ForeignKey(User, on_delete=models.CASCADE)
    winner = models.ForeignKey(User, blank=True, on_delete=models.CASCADE, related_name="winer")
    
    def __str__(self):
        return f"{self.title}"


class Bid(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="bids")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bids")
    user_bid = models.DecimalField(decimal_places=2, max_digits=10)
    
    def __str__(self):
        return f"User {self.user} for {self.item} - {self.user_bid}"
    
    
class Comment(models.Model):
    comment = models.CharField(max_length=128)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)


class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlists')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='watchlists')

    def __str__(self):
        return f"{self.item} - {self.user}"