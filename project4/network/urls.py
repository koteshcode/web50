
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("new_post", views.new_post, name="new_post"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("like_post/<int:post_id>", views.like_post, name="like_post"),
    path("posts", views.posts, name="posts"),
    path("register", views.register, name="register")
]
